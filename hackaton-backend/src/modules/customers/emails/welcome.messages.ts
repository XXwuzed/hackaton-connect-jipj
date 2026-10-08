export const welcomeMessages = {
  subject: 'Bienvenido a EnlaceHermano',
  preheader:
    'Tu inscripción está lista. Descubre los beneficios de estar cerca.',
  status: 'INSCRIPCIÓN CONFIRMADA',
  greeting: (firstName: string) => `Hola, ${firstName}.`,
  title: 'Estar cerca',
  titleAccent: 'tiene sus beneficios.',
  introduction:
    'Ya eres parte de EnlaceHermano. Gracias por sumarte a una comunidad que acompaña tu bienestar.',
  benefitsTitle: 'Tu próxima visita empieza aquí',
  benefits: [
    {
      title: 'Suma con tus compras',
      description:
        'Identifícate con tu cédula en el punto de venta para acumular puntos.',
    },
    {
      title: 'Disfruta tus beneficios',
      description:
        'Consulta con un asesor tus puntos y los productos disponibles para canjear.',
    },
    {
      title: 'Cuenta con nosotros',
      description:
        'Te acompañamos en tu tienda. Sin contraseñas y sin descargar una app.',
    },
  ],
  reminderTitle: 'Solo necesitas tu cédula',
  reminder:
    'En tu próxima visita, cuéntale al asesor que ya eres parte de EnlaceHermano.',
  closing: 'Las buenas conexiones empiezan aquí.',
  signature: 'El equipo de EnlaceHermano',
  reason: 'Recibes este correo porque completaste tu inscripción al club.',
  unsubscribe: 'Dar de baja mi inscripción',
  unsubscribeHelp:
    'Si no solicitaste el registro o prefieres dejar el club, puedes confirmar tu baja desde este enlace.',
  footer: 'EnlaceHermano · Unidos por tu bienestar',
};
