import { CONTACT_EMAIL, TERMS_VERSION } from "@/lib/legal";
import { LegalDoc } from "../Legal";

export const metadata = { title: "Política de privacidad" };

const OPERADOR = "[COMPLETAR: nombre o razón social del titular de Repaso]";

export default function Privacy() {
  return (
    <LegalDoc title="Política de privacidad" updated={TERMS_VERSION}>
      <p>
        En Repaso protegemos tus datos personales conforme a la Constitución de la República Bolivariana de Venezuela, que garantiza el derecho de toda persona a acceder a sus datos y a pedir su corrección o destrucción (artículo 28), y el respeto a su vida privada (artículo 60). El responsable de tus datos es {OPERADOR}. Esta política explica qué datos tratamos, para qué y cuáles son tus derechos.
      </p>

      <h2>1. Datos que tratamos</h2>
      <ul>
        <li>
          <strong>De tu cuenta:</strong> nombre, correo, contraseña (guardada cifrada por nuestro proveedor de autenticación; nosotros no la vemos), universidad, carrera, semestre y, si lo das, tu WhatsApp.
        </li>
        <li>
          <strong>Tu material de estudio:</strong> los archivos que subes, el texto que extraemos de ellos, las transcripciones de grabaciones y lo que la IA genera (resúmenes, fichas, quiz), además de tus conversaciones con el tutor y tu progreso.
        </li>
        <li>
          <strong>Envíos al equipo:</strong> lo que nos mandas en «Pide una explicación» (descripción, archivos y enlaces) y nuestra respuesta.
        </li>
        <li>
          <strong>Pagos:</strong> plan, monto, método, número de referencia, nombre, cédula y teléfono de quien paga, y el comprobante si lo adjuntas. No guardamos claves bancarias ni datos de tarjetas.
        </li>
        <li>
          <strong>Datos técnicos:</strong> registros básicos de acceso y errores necesarios para la seguridad y el funcionamiento. Usamos solo las cookies necesarias para mantener tu sesión; no usamos cookies publicitarias.
        </li>
      </ul>

      <h2>2. Para qué los usamos</h2>
      <ul>
        <li>Prestarte el Servicio: procesar tu material, generar tu kit de estudio, responder tus preguntas y tus envíos.</li>
        <li>Verificar pagos y administrar tu plan.</li>
        <li>Darte soporte y avisarte de cambios importantes del Servicio.</li>
        <li>Mantener la seguridad y prevenir abusos.</li>
        <li>Mejorar el Servicio con estadísticas agregadas que no te identifican.</li>
      </ul>
      <p>
        <strong>No vendemos tus datos ni tu material.</strong> No usamos tus archivos para entrenar modelos de inteligencia artificial, y nuestros proveedores de IA no los usan para ese fin según sus condiciones comerciales.
      </p>

      <h2>3. Quién más los procesa</h2>
      <p>Usamos estos proveedores, que tratan tus datos solo para prestarnos su servicio:</p>
      <ul>
        <li>
          <strong>Supabase</strong> (base de datos, autenticación y almacenamiento de archivos).
        </li>
        <li>
          <strong>Vercel</strong> (alojamiento de la aplicación web).
        </li>
        <li>
          <strong>Anthropic</strong> (modelo de inteligencia artificial Claude, que genera el kit de estudio y las respuestas del tutor).
        </li>
        <li>
          <strong>ElevenLabs</strong> (transcripción de clases grabadas, solo si subes audio o video).
        </li>
      </ul>
      <p>
        Estos proveedores operan servidores fuera de Venezuela, principalmente en los Estados Unidos. Al usar Repaso aceptas esa transferencia internacional, necesaria para prestar el Servicio. El equipo de Repaso solo accede a tu material cuando nos lo envías en «Pide una explicación», cuando nos pides soporte o cuando la ley o la seguridad del Servicio lo exigen.
      </p>

      <h2>4. Cuánto tiempo los guardamos</h2>
      <ul>
        <li>Tu cuenta y tu material, mientras tengas la cuenta. Puedes borrar materiales sueltos o la cuenta entera en cualquier momento.</li>
        <li>Al borrar la cuenta eliminamos tu perfil, materiales, archivos, conversaciones y envíos. Las copias de respaldo se eliminan en los ciclos normales de rotación de nuestros proveedores.</li>
        <li>Los registros de pago, el tiempo que exijan las normas tributarias y contables.</li>
      </ul>

      <h2>5. Tus derechos</h2>
      <p>Puedes, en cualquier momento:</p>
      <ul>
        <li>Acceder a tus datos y descargarlos en Perfil → «Descargar mis datos».</li>
        <li>Corregirlos en Perfil.</li>
        <li>Borrarlos, eliminando materiales o tu cuenta completa en Perfil.</li>
        <li>Pedirnos información sobre el uso de tus datos u oponerte a algún tratamiento, escribiendo a <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. Respondemos en un máximo de 15 días hábiles.</li>
      </ul>

      <h2>6. Seguridad</h2>
      <p>
        Cada cuenta solo puede ver su propia información gracias a reglas de acceso en la base de datos. Los archivos se guardan en almacenamiento privado y se entregan con enlaces temporales. Las conexiones van cifradas (HTTPS). Ningún sistema es infalible: si detectamos una brecha que afecte tus datos, te avisaremos sin demora.
      </p>

      <h2>7. Menores de edad</h2>
      <p>
        Repaso es para estudiantes universitarios. Si eres menor de 18 años, necesitas la autorización de tu representante. Si un representante cree que un menor nos dio datos sin autorización, puede escribirnos para eliminarlos.
      </p>

      <h2>8. Cambios</h2>
      <p>Si cambiamos esta política de forma importante, te avisaremos en la app o por correo antes de que el cambio aplique.</p>

      <h2>9. Contacto</h2>
      <p>
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
      </p>
    </LegalDoc>
  );
}
