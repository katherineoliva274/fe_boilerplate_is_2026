# Problemas conocidos

## 1. Descripción general

Este documento registra los problemas conocidos, las limitaciones y las verificaciones pendientes de la versión 1.0.0 del Sistema de Gestión de Gimnasio GKDS.

El frontend se encuentra desplegado en Vercel y el backend en Render, utilizando una base de datos PostgreSQL.

El registro se actualizará conforme se ejecuten las pruebas funcionales y de integración.

## 2. Problemas confirmados

Hasta el momento no se han documentado fallos reproducibles y confirmados en la versión desplegada.


## 3. Verificaciones pendientes

Las siguientes actividades están pendientes de completar o confirmar. No se consideran defectos mientras no se identifique un comportamiento incorrecto.

| Verificación | Descripción | Estado |
|---|---|---|
| Conexión frontend-backend | Comprobar el funcionamiento de las solicitudes entre Vercel y Render | Probado, Probado, pendiente de validación |
| Autenticación | Probar el inicio de sesión con los tres roles | Probado, pendiente de validación |
| Membresías y planes | Verificar las operaciones correspondientes | Probado, pendiente de validación |
| Clases y reservas | Comprobar reservas, cancelaciones y asistencia | Probado, pendiente de validación |
| Pagos | Comprobar cobros, historial y comprobantes | Probado, pendiente de validación |
| Rutinas y progreso | Verificar consultas y registros | Probado, pendiente de validación |
| Notificaciones | Comprobar generación y consulta de avisos | Probado, pendiente de validación |
| Reportes | Validar los resultados de las consultas administrativas | Probado, pendiente de validación |



## Seguimiento

Los resultados de las pruebas se documentarán en el plan de pruebas ejecutado del proyecto.
