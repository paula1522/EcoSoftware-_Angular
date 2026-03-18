# Convenciones
- ## ng 
(Palabra reservada para trabajar desde terminal) En angular es lo mejor ya que te crea todo el empaquetado en caso de componentes y ubica automaticamente en el caso de todos los archivos
- ## nombres
Siempre crear con esta estructura =  
| ng      | instruccion    | ubicacion(carpeta)| nombre |
|--------------------|---------------------|-------------|-------------|
|ng    | **generate component** o **g c**              | usuario/usuario/| usuario |

Instruccion completa  
ng g c usuario_components/usuario 
**No poner tipo de archivo, angular ya lo hace por defecto**

# Crear modulo de la aplicacion / ejm usuario  
### Importante tener los endpoint claros desde springboot 
### guardar todo por carpetas para mejor orden
1. Crear componente: (Paquete HTML, TS(Js fuertemente tipado), CSS, SPECT (Este es para pruebas, no se modifica y se puede borrar))  
El componente divide todo lo visual de la app web, este se conecta y envia y recibe informacion de componentes padre y componentes hijo, para un modulo o parte de la app (aqui Usuario) pueden haber muchos hijos, y esa es la idea, separar todo, y en caso de errores detectar/solucionar con confacilidad
 ng g c usuario_components/usuario
2. Crear un service: Este se conectara a api que tenemos, Springboot en este caso  
ng g s usuario_services/usuario

3. Crear un model: Este definira como recibe los datos angular y nos permitira crear un objeto para manipular los datos extraidos, Es transpasar los datos del DTO o la bd a aqui  
ng g interface usuario_models/usuario