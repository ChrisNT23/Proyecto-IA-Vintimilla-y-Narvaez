import os
import shutil
import argparse
import pandas as pd
from sklearn.model_selection import train_test_split
from tqdm import tqdm
import sys

try:
    from .utils import setup_logging, EMOTIONS
except ImportError:
    # Allow running as a standalone script if needed
    import logging
    EMOTIONS = ['angry', 'disgust', 'fear', 'happy', 'neutral', 'sad', 'surprise']
    def setup_logging(name):
        logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
        return logging.getLogger(name)

logger = setup_logging("PrepareDataset")

def setup_directories(output_dir):
    """Creates the train/val/test directory structure."""
    splits = ['train', 'val', 'test']
    for split in splits:
        for emotion in EMOTIONS:
            path = os.path.join(output_dir, split, emotion)
            os.makedirs(path, exist_ok=True)
    logger.info(f"Directory structure created at: {output_dir}")

def get_dataset_from_csv(images_dir, labels_csv):
    """Loads dataset metadata from a CSV file."""
    df = pd.read_csv(labels_csv)
    
    # Common column name mapping (handle different CSV formats)
    # Expecting 'filename' and 'label' or 'image' and 'emotion'
    col_mapping = {
        'image': 'filename',
        'file': 'filename',
        'emotion': 'label',
        'class': 'label'
    }
    df = df.rename(columns=col_mapping)
    
    if 'filename' not in df.columns or 'label' not in df.columns:
        raise ValueError("CSV must contain 'filename' and 'label' columns.")

    data = []
    logger.info("Validating files from CSV...")
    for _, row in tqdm(df.iterrows(), total=len(df)):
        fname = row['filename']
        label = str(row['label']).lower().strip()
        
        if label not in EMOTIONS:
            continue
            
        img_path = os.path.join(images_dir, fname)
        if os.path.exists(img_path):
            data.append({'path': img_path, 'label': label})
            
    return pd.DataFrame(data)

def get_dataset_from_folders(images_dir):
    """Loads dataset metadata by traversing folders."""
    data = []
    logger.info(f"Scanning directories in {images_dir}...")
    
    for emotion in EMOTIONS:
        emotion_dir = os.path.join(images_dir, emotion)
        if not os.path.exists(emotion_dir):
            # Try case-insensitive find
            found = False
            for d in os.listdir(images_dir):
                if d.lower() == emotion:
                    emotion_dir = os.path.join(images_dir, d)
                    found = True
                    break
            if not found:
                logger.warning(f"Directory for emotion '{emotion}' not found. Skipping.")
                continue

        files = [f for f in os.listdir(emotion_dir) if f.lower().endswith(('.png', '.jpg', '.jpeg'))]
        for f in tqdm(files, desc=f"Loading {emotion}"):
            img_path = os.path.join(emotion_dir, f)
            data.append({'path': img_path, 'label': emotion})
            
    return pd.DataFrame(data)

def split_dataset(df, train_p, val_p, test_p):
    """Performs stratified split on the dataframe."""
    # First split: Train vs (Val + Test)
    val_test_p = val_p + test_p
    train_df, val_test_df = train_test_split(
        df, 
        test_size=val_test_p, 
        stratify=df['label'], 
        random_state=42
    )
    
    # Second split: Val vs Test
    relative_test_p = test_p / val_test_p
    val_df, test_df = train_test_split(
        val_test_df, 
        test_size=relative_test_p, 
        stratify=val_test_df['label'], 
        random_state=42
    )
    
    return train_df, val_df, test_df

def copy_files(df, split_name, output_dir):
    """Copies files to the target directories."""
    logger.info(f"Copying files for {split_name} split...")
    for _, row in tqdm(df.iterrows(), total=len(df), desc=split_name):
        src = row['path']
        label = row['label']
        dst = os.path.join(output_dir, split_name, label, os.path.basename(src))
        
        # Avoid duplicate copy if file already exists
        if not os.path.exists(dst):
            shutil.copy2(src, dst)

def main():
    parser = argparse.ArgumentParser(description="Prepare FER dataset with stratified splitting.")
    parser.add_argument("--images_dir", type=str, required=True, help="Path to original images or root folder.")
    parser.add_argument("--labels_csv", type=str, help="Optional: Path to CSV with filename and label.")
    parser.add_argument("--output_dir", type=str, default="prepared_data", help="Output directory for organized data.")
    parser.add_argument("--train_split", type=float, default=0.7)
    parser.add_argument("--val_split", type=float, default=0.15)
    parser.add_argument("--test_split", type=float, default=0.15)
    
    args = parser.parse_args()

    # 1. Validation
    if not (0.99 <= (args.train_split + args.val_split + args.test_split) <= 1.01):
        logger.error("Splits must sum to 1.0 (e.g., 0.7, 0.15, 0.15)")
        return

    # 2. Load Metadata
    try:
        if args.labels_csv:
            df = get_dataset_from_csv(args.images_dir, args.labels_csv)
        else:
            df = get_dataset_from_folders(args.images_dir)
    except Exception as e:
        logger.error(f"Error loading dataset: {e}")
        return

    if df.empty:
        logger.error("No valid images or labels found. Check paths and class names.")
        return

    # 3. Print Initial Distribution
    logger.info(f"Total images found: {len(df)}")
    logger.info("\nClass Distribution:\n" + df['label'].value_counts().to_string())

    # 4. Split
    logger.info("Splitting dataset...")
    train_df, val_df, test_df = split_dataset(df, args.train_split, args.val_split, args.test_split)

    # 5. Execute Creation and Copy
    setup_directories(args.output_dir)
    copy_files(train_df, 'train', args.output_dir)
    copy_files(val_df, 'val', args.output_dir)
    copy_files(test_df, 'test', args.output_dir)

    # 6. Final Report
    logger.info("\nFinal Dataset Split Summary:")
    logger.info(f"Train: {len(train_df)} images")
    logger.info(f"Val:   {len(val_df)} images")
    logger.info(f"Test:  {len(test_df)} images")
    logger.info("\nProcessing complete. You can now use this output directory with the training script.")

if __name__ == "__main__":
    main()
