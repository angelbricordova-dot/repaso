import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { CONTACT_EMAIL, TERMS_VERSION } from "@/lib/legal";
import { CREDIT_PRICE_USD, PLANS } from "@/lib/plans";
import { LegalDoc } from "../Legal";

export const metadata = { title: "Términos y condiciones" };

// IMPORTANTE: completa los datos marcados con [COMPLETAR] y haz revisar este texto
// por un abogado venezolano antes de cobrar. Es una base sólida, no asesoría legal.
const OPERADOR = "[COMPLETAR: nombre o razón social del titular]";
const RIF = "[COMPLETAR: RIF]";
const DOMICILIO = "[COMPLETAR: ciudad y estado], Venezuela";
const usd = (n: number) => `$${n.toFixed(2).replace(".", ",")}`;

export default function Terms() {
  const { basico, pro, full } = PLANS;
  return (
    <LegalDoc title="Términos y condiciones" updated={TERMS_VERSION}>
      <p>
        Estos términos regulan el uso de {BRAND} (el «Servicio»), una plataforma web de ayuda con tareas escolares y universitarias en la que un equipo de personas resuelve y explica las tareas que envían los usuarios. El Servicio lo presta {OPERADOR}, RIF {RIF}, con domicilio en {DOMICILIO} («nosotros»). Al crear una cuenta aceptas estos términos y la <Link href="/privacidad">política de privacidad</Link>.
      </p>

      <h2>1. Quién puede usarlo</h2>
      <p>
        Debes tener 18 años o más. Si eres menor de edad, necesitas la autorización de tu madre, padre o representante legal, quien acepta estos términos en tu nombre y responde por el uso de la cuenta y por los pagos. La cuenta es personal: no se comparte ni se revende.
      </p>

      <h2>2. Qué hacemos y qué no</h2>
      <ul>
        <li>Recibimos la tarea con tus instrucciones, archivos y la fecha y hora en que la necesitas, y una persona del equipo la resuelve y te la entrega en la plataforma con su explicación.</li>
        <li>Podemos escribirte por el chat de la tarea para pedir información. Mientras la tarea espera tu respuesta, el plazo puede correrse.</li>
        <li>
          No hacemos: exámenes o evaluaciones en vivo mientras se están presentando; trabajos que requieran entrar a plataformas de tu institución con tu usuario y contraseña (nunca te pediremos tus claves); trabajos de grado o tesis completos; ni contenido ilegal, ofensivo o que viole derechos de terceros. Podemos rechazar una tarea; si lo hacemos, te devolvemos esa tarea a tu cupo.
        </li>
      </ul>

      <h2>3. Uso responsable del material</h2>
      <p>
        Lo que entregamos es material de apoyo para que entiendas y resuelvas tu tarea. Eres responsable de usarlo conforme a las normas de tu liceo o universidad. No garantizamos calificaciones: la nota depende del criterio de cada docente.
      </p>

      <h2>4. Planes, tareas sueltas y cupos</h2>
      <ul>
        <li>
          Planes mensuales: {basico.name} {usd(basico.priceUsd)} ({basico.tasksPerMonth} tareas), {pro.name} {usd(pro.priceUsd)} ({pro.tasksPerMonth} tareas) y {full.name} {usd(full.priceUsd)} ({full.tasksPerMonth} tareas). Tarea suelta: {usd(CREDIT_PRICE_USD)}. Al registrarte recibes 1 tarea gratis.
        </li>
        <li>El cupo del plan se cuenta por mes calendario y no se acumula. Las tareas sueltas no vencen mientras la cuenta exista.</li>
        <li>Una tarea pedida con menos de 24 horas de anticipación es urgente: solo está disponible en los planes que la incluyen y cuenta como 2 tareas.</li>
        <li>Cada plan incluye un número de correcciones por tarea, indicado en la página de precios. Una corrección ajusta la tarea a las instrucciones originales; un cambio de enunciado es una tarea nueva.</li>
        <li>Puedes cancelar una tarea sin costo mientras nadie la haya empezado.</li>
      </ul>

      <h2>5. Precios y pagos</h2>
      <ul>
        <li>Los precios se fijan en dólares de los Estados Unidos. Si pagas en bolívares (Pago Móvil), el monto se calcula con la tasa oficial del Banco Central de Venezuela vigente ese día, que se muestra antes de pagar.</li>
        <li>Los pagos se hacen por Pago Móvil, Binance o Zelle y los verificamos manualmente. El plan se activa por 30 días por cada mes pagado, desde la verificación o desde el vencimiento de tu plan vigente.</li>
        <li>No hay renovaciones ni cobros automáticos. Registrar referencias falsas o de terceros sin autorización es causa de cierre de la cuenta.</li>
        <li>Si lo necesitas, emitimos la factura correspondiente según la normativa tributaria vigente.</li>
      </ul>

      <h2>6. Plazos y reembolsos</h2>
      <ul>
        <li>Trabajamos para entregar antes de la hora que pediste. Si no entregamos a tiempo por causas nuestras, te devolvemos esa tarea a tu cupo como tarea suelta.</li>
        <li>Puedes pedir el reembolso de un pago dentro de los 7 días siguientes a su activación si no has enviado ninguna tarea con él. También reembolsamos pagos duplicados o que no podamos activar, por el mismo método cuando sea posible.</li>
      </ul>

      <h2>7. Invitaciones</h2>
      <p>
        Por cada persona que se registre con tu enlace y pague su primer plan te regalamos tareas sueltas, según lo indicado en la plataforma. Las invitaciones a ti mismo o con cuentas falsas anulan el premio.
      </p>

      <h2>8. Contenido y derechos</h2>
      <p>
        Conservas los derechos sobre lo que subes y nos das permiso solo para usarlo con el fin de resolver tu tarea. Lo que te entregamos es para tu uso personal; no lo publicamos ni lo reutilizamos con otros usuarios. No subas obras de terceros para redistribuirlas, en respeto de la Ley sobre el Derecho de Autor.
      </p>

      <h2>9. Responsabilidad</h2>
      <p>
        El Servicio puede interrumpirse por mantenimiento o fallas de electricidad, internet o proveedores. En la medida que lo permita la ley, nuestra responsabilidad total frente a ti se limita al monto que nos hayas pagado en los 3 meses anteriores al hecho que la origine. Están prohibidos el acceso indebido a cuentas o datos y cualquier conducta sancionada por la Ley Especial contra los Delitos Informáticos.
      </p>

      <h2>10. Cierre de la cuenta y cambios</h2>
      <p>
        Puedes borrar tu cuenta cuando quieras desde Perfil. Si cambiamos estos términos de forma importante, te avisaremos con al menos 15 días de anticipación; los precios de un período ya pagado no cambian.
      </p>

      <h2>11. Ley aplicable</h2>
      <p>
        Estos términos se rigen por las leyes de la República Bolivariana de Venezuela, incluida la Ley sobre Mensajes de Datos y Firmas Electrónicas, que reconoce la validez de esta aceptación electrónica. Intentaremos resolver cualquier diferencia de forma amistosa; si no es posible, serán competentes los tribunales de {DOMICILIO}.
      </p>

      <h2>12. Contacto</h2>
      <p>
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
      </p>
    </LegalDoc>
  );
}
