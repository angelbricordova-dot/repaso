import Link from "next/link";
import { CONTACT_EMAIL, TERMS_VERSION } from "@/lib/legal";
import { PLANS } from "@/lib/plans";
import { LegalDoc } from "../Legal";

export const metadata = { title: "Términos y condiciones" };

// IMPORTANTE: completa los datos marcados con [COMPLETAR] y haz revisar este texto
// por un abogado venezolano antes de cobrar. Es una base sólida, no asesoría legal.
const OPERADOR = "[COMPLETAR: nombre o razón social del titular de Repaso]";
const RIF = "[COMPLETAR: RIF]";
const DOMICILIO = "[COMPLETAR: ciudad y estado], Venezuela";

export default function Terms() {
  return (
    <LegalDoc title="Términos y condiciones" updated={TERMS_VERSION}>
      <p>
        Estos términos regulan el uso de Repaso (el «Servicio»), una plataforma web que ayuda a estudiantes a repasar sus clases con herramientas de inteligencia artificial. El Servicio lo presta {OPERADOR}, RIF {RIF}, con domicilio en {DOMICILIO} («Repaso», «nosotros»). Al crear una cuenta aceptas estos términos y la <Link href="/privacidad">política de privacidad</Link>.
      </p>

      <h2>1. Quién puede usar Repaso</h2>
      <p>
        Debes tener 18 años o más. Si eres menor de edad, necesitas la autorización de tu madre, padre o representante legal, quien acepta estos términos en tu nombre y es responsable del uso de la cuenta. Eres responsable de mantener tu contraseña en secreto y de la actividad de tu cuenta. Una cuenta es personal: no se comparte ni se revende.
      </p>

      <h2>2. Qué hace el Servicio</h2>
      <ul>
        <li>Procesa el material que subes (PDF, láminas, documentos, fotos, audio o video) para generar resúmenes, fichas, preguntas de práctica y respuestas de un tutor automático.</li>
        <li>Transcribe grabaciones de clases cuando tu plan lo incluye.</li>
        <li>Permite enviar al equipo de Repaso clases o temas que no entendiste para recibir una explicación preparada por una persona («Pide una explicación»), dentro del cupo de tu plan.</li>
      </ul>
      <p>
        El contenido generado por inteligencia artificial puede contener errores u omisiones. Es una herramienta de apoyo al estudio y no sustituye tus clases, a tus profesores ni la bibliografía oficial. Verifica la información importante antes de usarla en una evaluación.
      </p>

      <h2>3. Tu contenido y los derechos de autor</h2>
      <ul>
        <li>Conservas todos los derechos sobre lo que subes. Nos das un permiso limitado, no exclusivo y gratuito para almacenarlo, procesarlo y mostrártelo con el único fin de prestarte el Servicio.</li>
        <li>Solo debes subir material que tengas derecho a usar para tu estudio personal, como tus apuntes o el material que tu profesor o institución te entregó para la materia. No uses Repaso para copiar, publicar o redistribuir obras de terceros, en respeto de la Ley sobre el Derecho de Autor.</li>
        <li>Si eres titular de derechos y crees que un contenido en Repaso los infringe, escríbenos a <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> identificando la obra y el contenido. Lo revisaremos y, si corresponde, lo retiraremos.</li>
      </ul>

      <h2>4. Uso aceptable</h2>
      <p>No puedes usar el Servicio para:</p>
      <ul>
        <li>Hacer trampa durante una evaluación en curso o suplantar a otra persona en una actividad académica.</li>
        <li>Subir contenido ilegal, que viole la privacidad de otros (por ejemplo, grabar a personas sin su consentimiento cuando la ley lo exige), que incite a la violencia o al odio, o datos personales de terceros sin autorización.</li>
        <li>Intentar acceder a cuentas o datos ajenos, sobrecargar el sistema, automatizar el uso del Servicio o vulnerar su seguridad, conductas sancionadas por la Ley Especial contra los Delitos Informáticos.</li>
        <li>Revender, sublicenciar o usar el Servicio para crear un producto competidor.</li>
      </ul>
      <p>Podemos suspender o cerrar cuentas que incumplan estas reglas, y retirar el contenido que las infrinja.</p>

      <h2>5. Planes, precios y pagos</h2>
      <ul>
        <li>
          El plan Gratis tiene cupos limitados. Los planes pagos ({PLANS.repaso.name} y {PLANS.repaso_plus.name}) amplían esos cupos según lo indicado en la página de precios. Los cupos se cuentan por mes calendario y no son acumulables.
        </li>
        <li>Los precios se fijan en dólares de los Estados Unidos. Si pagas en bolívares (Pago Móvil), el monto se calcula con la tasa oficial del Banco Central de Venezuela vigente el día del pago, la cual se muestra antes de pagar.</li>
        <li>Los pagos se hacen por Pago Móvil, Binance o Zelle y se verifican manualmente. El plan se activa por 30 días por cada mes pagado, contados desde la verificación, o desde el vencimiento de tu plan vigente si todavía está activo.</li>
        <li>No hay renovaciones ni cobros automáticos. Al vencer el plan, tu cuenta pasa al plan Gratis y conservas tus materiales.</li>
        <li>Debes registrar una referencia de pago real. Registrar pagos falsos o de terceros sin autorización es motivo de cierre de la cuenta.</li>
        <li>Si lo requieres, emitiremos la factura correspondiente conforme a la normativa tributaria vigente. Escríbenos con tus datos fiscales.</li>
      </ul>

      <h2>6. Reembolsos</h2>
      <p>
        Puedes pedir el reembolso de un pago dentro de los 7 días siguientes a la activación si no has procesado más de 3 materiales ni usado envíos al equipo en ese período. También reembolsamos los pagos duplicados o los que no podamos activar. El reembolso se hace por el mismo método de pago cuando sea posible. Escríbenos a <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>

      <h2>7. Servicio de explicaciones del equipo</h2>
      <p>
        Las explicaciones que prepara el equipo de Repaso son material de apoyo para que entiendas un tema. No hacemos tareas, trabajos ni exámenes por ti. Procuramos responder lo antes posible, con prioridad para el plan {PLANS.repaso_plus.name} y según la fecha de examen que indiques, pero no garantizamos un plazo exacto.
      </p>

      <h2>8. Disponibilidad</h2>
      <p>
        Hacemos lo razonable para que el Servicio funcione de forma continua, pero puede haber interrupciones por mantenimiento, fallas de proveedores, de electricidad o de internet. No respondemos por daños derivados de esas interrupciones ni por calificaciones académicas obtenidas usando el Servicio. En la medida que lo permita la ley, nuestra responsabilidad total frente a ti se limita al monto que nos hayas pagado en los 3 meses anteriores al hecho que la origine.
      </p>

      <h2>9. Proveedores</h2>
      <p>
        Para prestar el Servicio usamos proveedores tecnológicos (alojamiento, base de datos, inteligencia artificial y transcripción), algunos ubicados fuera de Venezuela. Los detallamos en la <Link href="/privacidad">política de privacidad</Link>.
      </p>

      <h2>10. Cierre de la cuenta</h2>
      <p>
        Puedes borrar tu cuenta cuando quieras desde Perfil. Se eliminarán tus materiales, archivos y conversaciones. Conservamos los registros de pago el tiempo que exija la ley.
      </p>

      <h2>11. Cambios</h2>
      <p>
        Podemos actualizar estos términos. Si los cambios son importantes, te avisaremos en la app o por correo con al menos 15 días de anticipación. Si sigues usando el Servicio después de esa fecha, se entiende que los aceptas. Los precios de un período ya pagado no cambian.
      </p>

      <h2>12. Ley aplicable</h2>
      <p>
        Estos términos se rigen por las leyes de la República Bolivariana de Venezuela, incluyendo la Ley sobre Mensajes de Datos y Firmas Electrónicas, que reconoce la validez de esta aceptación electrónica. Cualquier controversia se intentará resolver primero de forma amistosa escribiéndonos; de no lograrse, se someterá a los tribunales competentes de {DOMICILIO}.
      </p>

      <h2>13. Contacto</h2>
      <p>
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
      </p>
    </LegalDoc>
  );
}
