# Sistema visual de EnlaceHermano

La referencia es la imagen de marca proporcionada por el usuario. Los dos frontends comparten los componentes de marca, iconos y estilos base de `packages/ui`; la navegación y los permisos siguen controlados por las reglas existentes.

| Uso                                                 | Color                   |
| --------------------------------------------------- | ----------------------- |
| Texto principal, botones y superficies destacadas   | Azul profundo `#084964` |
| Acentos de comunidad, selección y detalles gráficos | Turquesa `#17bfc3`      |
| Beneficios y detalles gráficos cálidos              | Coral `#f57853`         |
| Premios y acentos secundarios                       | Amarillo `#ffbd4b`      |
| Fondo general                                       | Marfil `#f8f5ef`        |
| Formularios, tablas y tarjetas                      | Blanco `#ffffff`        |

Los textos pequeños usan variantes oscuras del coral y el turquesa para conservar contraste sobre fondos claros. La firma y la ilustración son vectores ligeros inspirados en el símbolo de conexión de la referencia; no se ha incorporado una biblioteca gráfica ni fuentes remotas.

## Pantallas

- Formulario: presentación de beneficios y tarjeta de inscripción; contexto de tienda, consentimiento, carga, errores y confirmación. Sin QR válido, la inscripción permanece deshabilitada.
- Login: presentación de marca, formulario con opción de mostrar contraseña y ayuda para contactar al administrador. La sesión y el cambio obligatorio de contraseña conservan su comportamiento.
- Panel: navegación por permisos con sección activa, menú desplegable en móvil, identificación de sesión, resumen mensual con valores reales y accesos según rol.
- Pantallas internas: controles, tablas, tarjetas, estados, mapas y detalles comparten las mismas bases visuales.

Las composiciones se reorganizan a 740 px y los campos pareados a 480 px. La navegación móvil se abre dentro del flujo de la página, sin superponer un diálogo ni atrapar el foco. Se conservan etiquetas, indicadores de carga, avisos de error y foco de teclado, y se respeta la preferencia de movimiento reducido.

## Verificación

Comprobar tipos, lint, dependencias, formato, pruebas existentes y compilación de ambos frontends. Los Dockerfiles incluyen el nuevo paquete del workspace. La verificación visual en navegador queda pendiente por la instrucción vigente de `agents/instructions_1.md`: «No abras el navegador para probar los sistemas».

Este rediseño no despliega la aplicación ni modifica recursos AWS, reglas de negocio, roles o permisos.
