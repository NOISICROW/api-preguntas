// Configuración de la API de Gemini
const API_KEY = "AIzaSyCVAXBMENvY0O5UJdqKmj4w8Mlrvy2O66s";
const MODEL = "gemini-2.0-flash";

// Contadores
let correctas = parseInt(localStorage.getItem('correctas')) || 0;
let incorrectas = parseInt(localStorage.getItem('incorrectas')) || 0;

// Lista de temas
const temas = [
    "concepto de arreglo y operaciones sobre arreglos",
    "concepto de diccionarios y funciones básicas",
    "operadores lógicos, aritméticos, de comparación, ternario",
    "uso de la consola para debuggear",
    "funciones con parámetros por default",
    "manipulación del DOM con JavaScript",
    "eventos en JavaScript",
    "selectores CSS y especificidad",
    "modelo de caja en CSS",
    "promesas y async/await en JavaScript"
];

let preguntaActual = null;

async function respuestaAPI() {
    const temaAleatorio = temas[Math.floor(Math.random() * temas.length)];
    
    const prompt = `Genera una pregunta de opción múltiple sobre: ${temaAleatorio}. 
Responde ÚNICAMENTE con un objeto JSON válido:
{
  "question": "texto de la pregunta",
  "options": ["a) opción 1", "b) opción 2", "c) opción 3", "d) opción 4"],
  "correct_answer": "a) opción 1",
  "explanation": "explicación"
}`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;
    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();
        let textResult = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!textResult) throw new Error("Sin contenido");

        textResult = textResult.trim().replace(/```json\n?/g, '').replace(/```\n?/g, '');
        const startIdx = textResult.indexOf('{');
        const endIdx = textResult.lastIndexOf('}');
        const jsonStr = textResult.substring(startIdx, endIdx + 1);
        
        return JSON.parse(jsonStr);

    } catch (error) {
        console.error("ERROR:", error);
        document.getElementById('question').textContent = `Error: ${error.message}`;
        return null;
    }
}

function guardarContadores() {
    localStorage.setItem('correctas', correctas);
    localStorage.setItem('incorrectas', incorrectas);
}

function desplegarContadores() {
    document.getElementById('correctas').textContent = correctas;
    document.getElementById('incorrectas').textContent = incorrectas;
}

function reiniciarContadores() {
    if (confirm('¿Reiniciar contadores?')) {
        correctas = 0;
        incorrectas = 0;
        guardarContadores();
        desplegarContadores();
    }
}

function desplegarPregunta(datosPregunta) {
    preguntaActual = datosPregunta;
    document.getElementById('question').className = 'fs-5 fw-bold';
    document.getElementById('question').textContent = datosPregunta.question;

    const optionsContainer = document.getElementById('options');
    optionsContainer.innerHTML = '';

    datosPregunta.options.forEach((opcion) => {
        const button = document.createElement('button');
        button.className = 'btn btn-outline-primary mb-2';
        button.textContent = opcion;
        button.onclick = () => verificarRespuesta(opcion);
        optionsContainer.appendChild(button);
    });
}

function verificarRespuesta(opcionSeleccionada) {
    const buttons = document.querySelectorAll('#options button');

    buttons.forEach(button => {
        button.disabled = true;
        if (button.textContent === preguntaActual.correct_answer) {
            button.className = 'btn btn-success mb-2';
        } else if (button.textContent === opcionSeleccionada) {
            button.className = 'btn btn-danger mb-2';
        }
    });

    if (opcionSeleccionada === preguntaActual.correct_answer) {
        correctas++;
        document.getElementById('question').className = 'fs-5 text-success';
        document.getElementById('question').textContent = `✓ Correcto! ${preguntaActual.explanation}`;
    } else {
        incorrectas++;
        document.getElementById('question').className = 'fs-5 text-danger';
        document.getElementById('question').textContent = `✗ Incorrecto. ${preguntaActual.explanation}`;
    }

    guardarContadores();
    desplegarContadores();
    setTimeout(cargarPregunta, 3000);
}

async function cargarPregunta() {
    document.getElementById('question').textContent = '⏳ Cargando...';
    document.getElementById('options').innerHTML = '';

    const datosPregunta = await respuestaAPI();
    if (datosPregunta) desplegarPregunta(datosPregunta);
}

window.onload = () => {
    desplegarContadores();
    cargarPregunta();
};