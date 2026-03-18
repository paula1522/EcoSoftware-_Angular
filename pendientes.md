# Checklist de Pendientes

## **1. Completar el CRUD**
- [ ] Implementar la operación de **Actualizar (PUT)** en el frontend.
- [ ] Implementar la operación de **Eliminar (DELETE)** en el frontend.

## **2. Mejorar el manejo de errores**
- [ ] Agregar manejo de errores en el servicio `UsuarioService` para capturar y mostrar errores de las peticiones HTTP.
- [ ] Implementar un interceptor global para manejar errores de forma centralizada.

## **3. Reutilización de componentes**
- [ ] Crear un componente genérico para tablas (`app-table`) que reciba datos y columnas dinámicamente.
- [ ] Reemplazar las tablas actuales con el nuevo componente reutilizable.

## **4. Centralizar el estado**
- [ ] Usar Signals o NgRx para manejar el estado de usuarios (`usuarios`, `cargando`, `error`, etc.) en lugar de manejarlo directamente en el componente `Usuario`.

## **5. Mejorar la navegación**
- [ ] Agregar un botón "Volver" en el formulario de registro para regresar a la lista de usuarios.
- [ ] Asegurar que todas las vistas tengan navegación clara y accesible.

## **6. Validación y mensajes de error**
- [ ] Mostrar mensajes de error claros en el frontend cuando ocurran errores en las peticiones HTTP.
- [ ] Mejorar las validaciones en el formulario (`app-form-comp`) y mostrar mensajes de error específicos.

## **7. Implementar pruebas**
- [ ] Escribir pruebas unitarias para el servicio `UsuarioService`.
- [ ] Escribir pruebas unitarias para los componentes clave (`Usuario`, `app-form-comp`, `app-boton`).
- [ ] Escribir pruebas de integración para verificar el flujo completo del CRUD.

## **8. Optimización del rendimiento**
- [ ] Revisar el uso de `ngStyle` y reemplazarlo con clases CSS cuando sea posible para mejorar el rendimiento.
- [ ] Asegurarse de que las peticiones HTTP sean eficientes y no redundantes.

## **9. Documentación**
- [ ] Documentar el uso de cada componente reutilizable (`app-boton`, `app-form-comp`, `app-table`).
- [ ] Documentar el flujo de datos entre el frontend y el backend.

---

### **Notas adicionales**
- La URL base del backend está definida como `http://localhost:8080/api/personas`. Asegúrate de que el backend esté corriendo y accesible desde el frontend.
- Verifica que los endpoints del backend estén correctamente configurados y respondan a las peticiones esperadas.
