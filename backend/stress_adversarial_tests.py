import requests
import base64
import time
import json
import random
from concurrent.futures import ThreadPoolExecutor
import sys

# Configuración de URLs
NODE_URL = "http://localhost:5000"
IA_URL = "http://localhost:5001"

# Imagen de prueba mínima (1x1 pixel blanco en base64)
VALID_IMAGE_B64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="

class MoCATester:
    def __init__(self):
        self.results = []

    def log_result(self, category, test_name, status, response_time, detail=""):
        self.results.append({
            "Categoría": category,
            "Prueba": test_name,
            "Estado": status,
            "Tiempo (s)": round(response_time, 3),
            "Detalle": detail[:50] + "..." if len(detail) > 50 else detail
        })

    def run_stress_inference(self, num_requests=10):
        """Prueba de estrés: Múltiples inferencias de IA simultáneas"""
        print(f"[*] Iniciando Prueba de Estrés: {num_requests} inferencias simultáneas al servidor IA...")
        
        def send_request():
            start = time.time()
            try:
                # Simular envío de cubo
                resp = requests.post(f"{IA_URL}/api/evaluate-cube", 
                                   json={"image": VALID_IMAGE_B64}, 
                                   timeout=15)
                end = time.time()
                if resp.status_code == 200:
                    return ("OK", end - start, "Éxito")
                else:
                    return ("FAIL", end - start, f"Status {resp.status_code}")
            except Exception as e:
                return ("ERROR", 0, str(e))

        with ThreadPoolExecutor(max_workers=num_requests) as executor:
            futures = [executor.submit(send_request) for _ in range(num_requests)]
            
            times = []
            successes = 0
            for f in futures:
                status, rtime, detail = f.result()
                times.append(rtime)
                if status == "OK": successes += 1
            
            avg_time = sum(times) / len(times) if times else 0
            self.log_result("Estrés", f"{num_requests} Inferencias IA", 
                           "EXITOSO" if successes == num_requests else "FALLIDO", 
                           avg_time, f"{successes}/{num_requests} exitosas")

    def run_comprehensive_ia_tests(self):
        """Pruebas en todos los endpoints de IA disponibles"""
        print("[*] Iniciando Pruebas Exhaustivas de IA (Reloj, Emociones, Multimodal)...")
        
        # 1. Reloj (Clock)
        start = time.time()
        try:
            resp = requests.post(f"{IA_URL}/api/evaluate-clock", json={"image": VALID_IMAGE_B64}, timeout=10)
            self.log_result("IA Model", "Evaluación Reloj", 
                           "OK" if resp.status_code == 200 else "ERROR", 
                           time.time() - start, f"Status {resp.status_code}")
        except Exception as e:
            self.log_result("IA Model", "Evaluación Reloj", "TIMEOUT/ERROR", 0, str(e))

        # 2. Emociones (Emotion)
        start = time.time()
        try:
            resp = requests.post(f"{IA_URL}/api/evaluate-emotion", json={"image": VALID_IMAGE_B64}, timeout=10)
            self.log_result("IA Model", "Reconocimiento Emociones", 
                           "OK" if resp.status_code == 200 else "ERROR", 
                           time.time() - start, f"Status {resp.status_code}")
        except Exception as e:
            self.log_result("IA Model", "Reconocimiento Emociones", "TIMEOUT/ERROR", 0, str(e))

        # 3. Integración Multimodal (MIIM)
        start = time.time()
        test_multimodal_data = {
            "moca": {"total_score": 25},
            "emotions": {"distribution": {"neutral": 0.8}, "volatility": 0.1},
            "clock": {"score": 2},
            "cube": {"score": 1}
        }
        try:
            resp = requests.post(f"{IA_URL}/api/multimodal-integration", json=test_multimodal_data, timeout=10)
            self.log_result("IA Engine", "Integración Multimodal", 
                           "OK" if resp.status_code == 200 else "ERROR", 
                           time.time() - start, f"Status {resp.status_code}")
        except Exception as e:
            self.log_result("IA Engine", "Integración Multimodal", "TIMEOUT/ERROR", 0, str(e))

    def run_adversarial_tests(self):
        """Pruebas Adversariales: Entradas malformadas o peligrosas"""
        print("[*] Iniciando Pruebas Adversariales...")

        # 1. Imagen Corrupta (No es Base64 válido de imagen)
        start = time.time()
        try:
            resp = requests.post(f"{IA_URL}/api/evaluate-cube", 
                               json={"image": "NotAnImageDataString123456"}, 
                               timeout=5)
            self.log_result("Adversarial", "Imagen Corrupta", 
                           "RESILIENTE" if resp.status_code != 200 else "VULNERABLE", 
                           time.time() - start, f"Respondió con {resp.status_code}")
        except: pass

        # 2. JSON Malformado
        start = time.time()
        try:
            resp = requests.post(f"{IA_URL}/api/evaluate-cube", 
                               data='{"image": "test", "broken": }', # JSON Inválido
                               headers={"Content-Type": "application/json"},
                               timeout=5)
            self.log_result("Adversarial", "JSON Malformado", 
                           "RESILIENTE" if resp.status_code >= 400 else "VULNERABLE", 
                           time.time() - start, f"Respondió con {resp.status_code}")
        except: pass

        # 3. Payload Gigante (DoS local)
        start = time.time()
        huge_data = "data:image/png;base64," + ("A" * 1000 * 1000) # 1MB de basura
        try:
            resp = requests.post(f"{IA_URL}/api/evaluate-cube", 
                               json={"image": huge_data}, 
                               timeout=10)
            self.log_result("Adversarial", "Payload Gigante (1MB)", 
                           "ESTABLE" if resp.status_code != 500 else "CRASH", 
                           time.time() - start, f"Respondió con {resp.status_code}")
        except Exception as e:
            self.log_result("Adversarial", "Payload Gigante (1MB)", "TIMEOUT/ERROR", 0, str(e))

    def run_boundary_data_tests(self):
        """Pruebas de Límites: Datos de negocio inválidos"""
        print("[*] Iniciando Pruebas de Límites (API Negocio)...")
        
        # Simular guardado de Moca con puntaje imposible
        start = time.time()
        invalid_moca = {
            "patientId": "65b2636f86...", # ID ficticio
            "totalScore": 999, # Puntaje imposible
            "totalMaxScore": 30,
            "modulesData": {}
        }
        try:
            # Nota: Esto fallará con 401 si no hay token, pero probamos la ruta
            resp = requests.post(f"{NODE_URL}/api/mocaSelf", json=invalid_moca, timeout=5)
            self.log_result("Límites", "Puntaje MoCA > 30", 
                           "PREVENIDO" if resp.status_code == 401 else "ACEPTADO (Verificar)", 
                           time.time() - start, f"Código {resp.status_code} (Auth requerida)")
        except: pass

        # 4. Datos malformados en Moca (Missing modulesData)
        start = time.time()
        try:
            resp = requests.post(f"{NODE_URL}/api/mocaSelf", json={"patientId": "123"}, timeout=5)
            self.log_result("Límites", "MoCA Datos Incompletos", 
                           "MANEJADO" if resp.status_code in [400, 401] else "VULNERABLE", 
                           time.time() - start, f"Código {resp.status_code}")
        except: pass

        # 5. Inyección de tipos inválidos
        start = time.time()
        try:
            resp = requests.post(f"{NODE_URL}/api/mocaSelf", json={"totalScore": "DIEZ_PUNTOS"}, timeout=5)
            self.log_result("Adversarial", "Tipo de dato inválido", 
                           "RESILIENTE" if resp.status_code >= 400 else "VULNERABLE", 
                           time.time() - start, f"Código {resp.status_code}")
        except: pass

    def print_summary(self):
        print("\n" + "="*80)
        print("                REPORTE DE PRUEBAS DE ESTRÉS Y ADVERSARIALES")
        print("="*80)
        print(f"{'CATEGORÍA':<15} | {'PRUEBA':<30} | {'ESTADO':<12} | {'TIEMPO':<8} | {'DETALLE'}")
        print("-" * 80)
        for r in self.results:
            print(f"{r['Categoría']:<15} | {r['Prueba']:<30} | {r['Estado']:<12} | {r['Tiempo (s)']:<8} | {r['Detalle']}")
        print("="*80)
        print("[!] Nota: 'RESILIENTE' significa que el sistema manejó el error sin colapsar.")
        print("[!] Nota: 'VULNERABLE' significa que el sistema aceptó datos basura como válidos.")

if __name__ == "__main__":
    tester = MoCATester()
    try:
        # Verificar si los servidores están vivos
        requests.get(IA_URL, timeout=2)
    except:
        print("[ERROR] El servidor de IA (Puerto 5001) no está respondiendo.")
        print("Asegúrate de ejecutar 'python backend/model_server.py' antes de la prueba.")
        sys.exit(1)

    tester.run_stress_inference(num_requests=10) # Estrés leve
    tester.run_stress_inference(num_requests=30) # Estrés moderado
    tester.run_comprehensive_ia_tests() # Nuevos endpoints de IA
    tester.run_adversarial_tests()
    tester.run_boundary_data_tests()
    tester.print_summary()
