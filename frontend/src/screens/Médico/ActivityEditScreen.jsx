import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Form, Button } from "react-bootstrap";
import Message from "../../components/Message";
import Loader from "../../components/Loader";
import FormContainer from "../../components/FormContainer";
import { toast } from "react-toastify";
import { useUpdateActivityMutation, useGetActivityDetailsQuery, useUploadActivityImageMutation } from "../../slices/activitiesSlice.js";

const ActivityEditScreen = () => {
    const { id: activityId } = useParams();

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState('');
    const [dateCompletion, setDateCompletion] = useState('');
    const [scoreObtained, setScoreObtained] = useState('');
    const [timeUsed, setTimeUsed] = useState('');
    const [difficultyLevel, setDifficultyLevel] = useState('');
    const [observations, setObservations] = useState('');
    const [progress, setProgress] = useState('');
    const [image, setImage] = useState('');
    const [activeView, setActiveView] = useState(false);

    const {
        data: activity,
        isLoading,
        refetch,
        error,
    } = useGetActivityDetailsQuery(activityId);

    const [updateActivity, { isLoading: loadingUpdate }] = useUpdateActivityMutation();
    const [uploadActivityImage, { isLoading: loadingUpload }] = useUploadActivityImageMutation();

    const navigate = useNavigate();

    useEffect(() => {
        if (activity) {
            setName(activity.name);
            setDescription(activity.description);
            setType(activity.type);
            setDateCompletion(activity.dateCompletion);
            setScoreObtained(activity.scoreObtained);
            setTimeUsed(activity.timeUsed);
            setDifficultyLevel(activity.difficultyLevel);
            setObservations(activity.observations);
            setProgress(activity.progress);
            setImage(activity.image);
            setActiveView(activity.activeView);
        }
    }, [activity]);

    const submitHandler = async (e) => {
        e.preventDefault();
        const updatedActivity = {
            activityId,
            name,
            description,
            type,
            dateCompletion,
            scoreObtained,
            timeUsed,
            difficultyLevel,
            observations,
            progress,
            image,
            activeView,
        };

        const result = await updateActivity(updatedActivity);
        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success('Activity updated');
            navigate('/admin/activities');
        }
    };

    const uploadFileHandler = async (e) => {
        const file = e.target.files[0];
        const formData = new FormData();
        formData.append('image', file);
    
        try {
            const res = await uploadActivityImage(formData).unwrap();
            toast.success('Image uploaded successfully');
            setImage(res.image);
        } catch (err) {
            console.error('Upload error:', err);
            toast.error(err?.data?.message || 'Error uploading file');
        }
    };
    

    return (
        <>
            <Link to='/admin/activities' className="btn btn-light my-3">
                Go back
            </Link>
            <FormContainer>
                <h1>Edit Activity</h1>
                {loadingUpdate && <Loader />}

                {isLoading ? <Loader /> : error ? (
                    <Message variant='danger'> {error.message || 'An error occurred'}</Message>
                ) : (
                    <Form onSubmit={submitHandler}>
                        <Form.Group controlId='name' className="my-2">
                            <Form.Label>Nombre</Form.Label>
                            <Form.Control
                                type='text'
                                placeholder='Ingrese el nombre de la actividad'
                                value={name}
                                onChange={(e) => setName(e.target.value)}>
                            </Form.Control>
                        </Form.Group>

                        <Form.Group controlId='description' className="my-2">
                            <Form.Label>Descripción</Form.Label>
                            <Form.Control
                                type='text'
                                placeholder='Ingrese descripción'
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}>
                            </Form.Control>
                        </Form.Group>

                        <Form.Group controlId='image' className="my-2">
                            <Form.Label>Imagen</Form.Label>
                            <Form.Control type='text' placeholder="Enter image URL" value={image} onChange={(e) => setImage(e.target.value)}></Form.Control>
                            <Form.Control type='file' label='Choose file' onChange={uploadFileHandler}></Form.Control>
                        </Form.Group>

                        <Form.Group controlId='difficultyLevel' className="my-2">
                            <Form.Label>Nivel de dificultad</Form.Label>
                            <Form.Control
                                type='text'
                                placeholder='Ingrese nivel de dificultad'
                                value={difficultyLevel}
                                onChange={(e) => setDifficultyLevel(e.target.value)}>
                            </Form.Control>
                        </Form.Group>

                        <Form.Group controlId='activeView' className="my-2">
                            <Form.Label>Vista Activa</Form.Label>
                            <Form.Check
                                type='checkbox'
                                label='Está activo'
                                checked={activeView}
                                onChange={(e) => setActiveView(e.target.checked)}>
                            </Form.Check>
                        </Form.Group>

                        <Button
                            type='submit'
                            variant='primary'
                            className='my-2'>
                            Update Activity
                        </Button>
                    </Form>
                )}
            </FormContainer>
        </>
    );
};

export default ActivityEditScreen;
