import React, { useState } from 'react';
import { X, BookOpen, CheckCircle, Lightbulb, FileText } from 'lucide-react';

export default function UserStoryGuide({ onClose }) {
  const [activeTab, setActiveTab] = useState('example');

  const tabs = [
    { id: 'example', label: 'Ejemplo Perfecto', icon: CheckCircle },
    { id: 'structure', label: 'Estructura', icon: FileText },
    { id: 'tips', label: 'Tips Rápidos', icon: Lightbulb },
    { id: 'template', label: 'Plantilla', icon: BookOpen }
  ];

  const exampleStory = {
    id: 'US-042',
    title: 'Recuperación de contraseña mediante email',
    description: 'Como usuario registrado, quiero poder resetear mi contraseña mediante email para recuperar el acceso a mi cuenta si la olvido.',
    storyPoints: 5,
    priority: 'high',
    acceptanceCriteria: [
      { given: 'Estoy en la página de login', when: 'Hago clic en "¿Olvidaste tu contraseña?"', then: 'Soy redirigido a la página de recuperación de contraseña' },
      { given: 'Estoy en la página de recuperación', when: 'Ingreso mi email registrado y presiono "Enviar"', then: 'Recibo un email con un link de recuperación en menos de 2 minutos' },
      { given: 'Recibí el email de recuperación', when: 'Hago clic en el link dentro de las 24 horas', then: 'Puedo ingresar una nueva contraseña' },
      { given: 'El link de recuperación tiene más de 24 horas', when: 'Hago clic en el link', then: 'Veo un mensaje "Link expirado. Solicita uno nuevo"' },
      { given: 'Ingreso una nueva contraseña', when: 'La contraseña tiene menos de 8 caracteres', then: 'Veo un mensaje de error de validación' }
    ],
    technicalDetails: ['Usar tokens JWT con expiración de 24 horas', 'Enviar email mediante servicio de email configurado', 'Hashear la nueva contraseña antes de guardar', 'Invalidar el token después de usarse'],
    dependencies: ['US-001: Sistema de autenticación básico'],
    nextSteps: ['US-043: Cambiar contraseña desde perfil']
  };

  const structure = [
    { title: '1. Formato Básico', content: 'Como [tipo de usuario]\nQuiero [acción/funcionalidad]\nPara [beneficio/razón]' },
    { title: '2. Criterios de Aceptación', content: 'Given [contexto]\nWhen [acción]\nThen [resultado esperado]\n\n✓ Mínimo 3-5 criterios\n✓ Incluir casos de error\n✓ Ser específico y medible' },
    { title: '3. Story Points (Fibonacci)', content: '1 = Muy pequeño (1-2 horas)\n2 = Pequeño (medio día)\n3 = Mediano (1 día)\n5 = Grande (2-3 días)\n8 = Muy grande (1 semana)\n13 = Enorme (2 semanas)\n21+ = Dividir en historias más pequeñas' },
    { title: '4. Prioridad', content: 'Urgent = Crítico para el negocio\nHigh = Importante, poco tiempo\nMedium = Necesario, puede esperar\nLow = Nice to have' }
  ];

  const tips = [
    { emoji: '✅', text: 'Enfócate en el VALOR, no en la implementación técnica' },
    { emoji: '📏', text: 'Si es mayor a 13 puntos, divídela en historias más pequeñas' },
    { emoji: '🎯', text: 'Cada historia debe ser INDEPENDIENTE y completable en un sprint' },
    { emoji: '✍️', text: 'Escribe criterios de aceptación específicos y medibles' },
    { emoji: '👥', text: 'Usa personas/roles específicos, no solo "usuario"' },
    { emoji: '🚫', text: 'Evita palabras vagas: "mejorar", "bonito", "fácil"' },
    { emoji: '🔗', text: 'Identifica dependencias claramente' },
    { emoji: '📝', text: 'Si no puedes estimarla, necesitas más información' },
    { emoji: '💡', text: 'Incluye contexto técnico, pero en sección separada' },
    { emoji: '🎨', text: 'Agrega mockups o wireframes si ayuda a clarificar' }
  ];

  const template = `# US-XXX: [Título descriptivo]

## Historia
Como [tipo de usuario]
Quiero [funcionalidad específica]
Para [beneficio/valor claro]

## Descripción Detallada
[Contexto adicional, problema que resuelve, importancia]

## Acceptance Criteria
✓ Given [contexto]
  When [acción]
  Then [resultado esperado]

✓ Given [contexto]
  When [acción]
  Then [resultado esperado]

✓ Given [contexto]
  When [acción]
  Then [resultado esperado]

## Detalles Técnicos
- [Consideraciones de implementación]
- [Integraciones necesarias]
- [Impacto en otros sistemas]

## Dependencias
- Bloqueado por: [US-XXX]
- Desbloquea: [US-YYY]

## Información
Story Points: [X]
Priority: [Urgent/High/Medium/Low]
Assignee: [Nombre]
Sprint: [Sprint #]

## Notas
[Cualquier contexto adicional]`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-gray-100 bg-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <BookOpen className="text-primary" size={28} />
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Guía de User Stories</h2>
                <p className="text-sm text-slate-600">Buenas prácticas y ejemplos</p>
              </div>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="border-b border-slate-200 bg-slate-50">
          <div className="flex gap-1 px-6">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors ${activeTab === tab.id ? 'text-primary border-b-2 border-primary bg-white' : 'text-gray-500 hover:text-gray-900'}`}>
                  <Icon size={18} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'example' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 p-4 rounded">
                <p className="text-sm text-green-800 font-semibold">✨ Este es un ejemplo de user story perfectamente estructurada</p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className="font-mono text-lg font-bold text-blue-600">{exampleStory.id}</span>
                    <h3 className="text-2xl font-bold text-slate-800 mt-1">{exampleStory.title}</h3>
                  </div>
                  <div className="flex gap-2">
                    <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-xs font-bold">{exampleStory.priority.toUpperCase()}</span>
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-bold">{exampleStory.storyPoints} pts</span>
                  </div>
                </div>

                <div className="bg-white border-l-4 border-blue-500 p-4 rounded mb-4">
                  <p className="text-slate-700 italic text-lg">{exampleStory.description}</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                      <CheckCircle size={20} className="text-green-600" />
                      Acceptance Criteria
                    </h4>
                    <div className="space-y-3">
                      {exampleStory.acceptanceCriteria.map((criteria, idx) => (
                        <div key={idx} className="bg-white border border-slate-200 rounded p-3">
                          <div className="text-sm space-y-1">
                            <p><span className="font-semibold text-purple-600">Given</span> {criteria.given}</p>
                            <p><span className="font-semibold text-blue-600">When</span> {criteria.when}</p>
                            <p><span className="font-semibold text-green-600">Then</span> {criteria.then}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-800 mb-2">Detalles Técnicos</h4>
                    <ul className="space-y-1">
                      {exampleStory.technicalDetails.map((detail, idx) => (
                        <li key={idx} className="text-sm text-slate-600 flex items-start gap-2">
                          <span className="text-blue-600 mt-1">•</span>
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-bold text-slate-800 mb-2">Dependencias</h4>
                      {exampleStory.dependencies.map((dep, idx) => (
                        <p key={idx} className="text-sm text-orange-600">{dep}</p>
                      ))}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 mb-2">Siguientes Pasos</h4>
                      {exampleStory.nextSteps.map((step, idx) => (
                        <p key={idx} className="text-sm text-green-600">{step}</p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'structure' && (
            <div className="space-y-6">
              {structure.map((section, idx) => (
                <div key={idx} className="bg-slate-50 border border-slate-200 rounded-lg p-5">
                  <h3 className="font-bold text-lg text-slate-800 mb-3">{section.title}</h3>
                  <pre className="bg-white border border-slate-200 rounded p-4 text-sm text-slate-700 whitespace-pre-wrap font-mono">{section.content}</pre>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'tips' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tips.map((tip, idx) => (
                <div key={idx} className="bg-white border border-gray-100 rounded-lg p-4 hover:border-primary transition-all duration-200">
                  <div className="flex items-start gap-3">
                    <span className="text-3xl">{tip.emoji}</span>
                    <p className="text-slate-700 text-sm leading-relaxed">{tip.text}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'template' && (
            <div>
              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded mb-4">
                <p className="text-sm text-yellow-800">
                  <strong>💡 Tip:</strong> Copia esta plantilla y úsala como referencia al crear nuevas user stories
                </p>
              </div>
              <div className="bg-slate-900 text-green-400 rounded-lg p-6 relative">
                <button onClick={() => { navigator.clipboard.writeText(template); alert('¡Plantilla copiada al portapapeles!'); }} className="absolute top-4 right-4 bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 transition-colors">
                  Copiar
                </button>
                <pre className="text-sm font-mono whitespace-pre-wrap overflow-x-auto">{template}</pre>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-slate-200 px-6 py-4 bg-slate-50">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-600">📚 Basado en el framework <strong>INVEST</strong> y mejores prácticas de Agile/Scrum</p>
            <button onClick={onClose} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90 transition-all duration-200 font-medium">Cerrar</button>
          </div>
        </div>
      </div>
    </div>
  );
}
