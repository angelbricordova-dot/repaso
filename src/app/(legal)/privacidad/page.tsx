import { BRAND } from "@/lib/brand";
import { CONTACT_EMAIL, TERMS_VERSION } from "@/lib/legal";
import { LegalDoc } from "../Legal";

export const metadata = { title: "Política de privacidad" };

const OPERADOR = "[COMPLETAR: nombre o razón social del titular]";

export default function Privacy() {
  return (
    <LegalDoc title="Política de privacidad" updated={TERMS_VERSION}>
      <p>
        En {BRAND} protegemos tus datos conforme a la Constitución de la República Bolivariana de Venezuela, que garantiza el derecho de toda persona a acceder a sus datos y pedir su corrección o destrucción (artículo 28) y el respeto a su vida privada (artículo 60). El responsable de tus datos es {OPERADOR}.
      </p>

      <h2>1. Qué datos tratamos</h2>
      <ul>
        <li>
          <strong>Cuenta:</strong> nombre, correo, WhatsApp, nivel de estudios, liceo o universidad y carrera. La contraseña la guarda cifrada nuestro proveedor de autenticación; nosotros no la vemos.
        </li>
        <li>
          <strong>Tareas:</strong> instrucciones, archivos, enlaces, mensajes del chat, entregas y calificaciones.
        </li>
        <li>
          <strong>Pagos:</strong> plan, monto, método, referencia, y nombre, cédula y teléfono de quien paga, y el capture si lo adjuntas. No guardamos claves bancarias ni datos de tarjetas.
        </li>
        <li>
          <strong>Técnicos:</strong> registros básicos de acceso y errores. Solo usamos las cookies necesarias para mantener tu sesión.
        </li>
      </ul>

      <h2>2. Para qué</h2>
      <ul>
        <li>Resolver y entregar tus tareas, y escribirte por el chat o por WhatsApp sobre ellas.</li>
        <li>Verificar pagos y administrar tu plan, tus tareas sueltas y tus invitaciones.</li>
        <li>Dar soporte, mantener la seguridad y mejorar el Servicio con estadísticas que no te identifican.</li>
      </ul>
      <p>
        <strong>No vendemos tus datos ni tus tareas, y no los usamos para entrenar inteligencia artificial.</strong>
      </p>

      <h2>3. Quién los ve</h2>
      <ul>
        <li>Las personas del equipo que trabajan tu tarea ven tu nombre, tu nivel, tu institución, tu WhatsApp y el contenido de la tarea. Están obligadas a mantenerlo en reserva.</li>
        <li>
          Proveedores tecnológicos: <strong>Supabase</strong> (base de datos, autenticación y archivos) y <strong>Vercel</strong> (alojamiento web), con servidores fuera de Venezuela, principalmente en los Estados Unidos. Al usar el Servicio aceptas esa transferencia, necesaria para prestarlo.
        </li>
      </ul>

      <h2>4. Cuánto tiempo</h2>
      <p>
        Mientras tengas la cuenta. Al borrarla eliminamos tu perfil, tareas, mensajes y archivos; las copias de respaldo se eliminan en los ciclos normales de nuestros proveedores. Los registros de pago se conservan el tiempo que exijan las normas tributarias.
      </p>

      <h2>5. Tus derechos</h2>
      <ul>
        <li>Acceder y descargar tus datos desde Perfil → «Descargar mis datos».</li>
        <li>Corregirlos en Perfil y borrar tu cuenta cuando quieras.</li>
        <li>
          Pedirnos información u oponerte a algún uso escribiendo a <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. Respondemos en un máximo de 15 días hábiles.
        </li>
      </ul>

      <h2>6. Seguridad y menores</h2>
      <p>
        Cada estudiante solo puede ver su propia información, los archivos se guardan en almacenamiento privado y se entregan con enlaces temporales, y las conexiones van cifradas. Si eres menor de 18 años necesitas la autorización de tu representante; un representante puede pedirnos borrar los datos de un menor que se registró sin permiso.
      </p>

      <h2>7. Contacto</h2>
      <p>
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
      </p>
    </LegalDoc>
  );
}
