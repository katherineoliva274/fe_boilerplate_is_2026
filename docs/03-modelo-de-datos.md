# Modelo de datos

## 1. Fuente y alcance

Este documento describe el esquema de datos que está en `prisma/schema.prisma`, en el backend del Sistema de Gestión de Gimnasio GKDS. La base de datos es PostgreSQL y usamos Prisma como ORM. El esquema tiene **28 modelos**, y dividimos los diagramas por área funcional para que se lean mejor en GitHub.

> **Importante:** El esquema de Prisma define los modelos y sus relaciones, pero por sí solo no garantiza que todas las migraciones estén aplicadas en producción ni que todos los módulos funcionen. Antes de la entrega hay que confirmar la versión final del esquema.

## 2. Convenciones

- **PK:** clave primaria (`@id`).
- **FK:** clave foránea (`@relation(fields: ..., references: ...)`).
- **UQ:** valor único (`@unique` o restricción compuesta).
- Los diagramas muestran los atributos más representativos. La lista completa de campos, y cuáles pueden ser nulos, está en `schema.prisma`.
- `@@map` indica el nombre real de la tabla en PostgreSQL cuando es distinto del nombre del modelo.
- Algunas reglas de unicidad usan índices parciales, y algunas tablas tienen *check constraints* o restricciones de exclusión. Para verlas hay que revisar las migraciones SQL.

## 3. Diagramas entidad-relación por módulo

### 3.1. Usuarios, perfiles y seguridad

```mermaid
erDiagram
    User {
        String id PK
        String email UK
        DateTime createdAt
    }
    UserProfile {
        String id PK
        String userId FK
    }
    MemberProfile {
        String id PK
        String userId FK
        String memberNumber UK
        DateTime createdAt
    }
    RefreshToken {
        String id PK
        String userId FK
        DateTime createdAt
    }
    User ||--o| UserProfile : "tiene"
    User ||--o| MemberProfile : "identifica"
    User ||--o{ RefreshToken : "mantiene"}
```

**Descripción de entidades**

| Modelo | Tabla PostgreSQL | Función |
|---|---|---|
| `User` | `users` | Cuentas, estado de activación y roles. Guarda el hash de la contraseña. |
| `UserProfile` | `user_profiles` | Nombre completo y teléfono de cada cuenta. |
| `MemberProfile` | `member_profiles` | Número único de miembro de cada usuario. |
| `RefreshToken` | `refresh_tokens` | Hashes, vencimiento y revocación de los tokens de actualización. |

### 3.2. Membresías y pagos

```mermaid
erDiagram
    User {
        String id PK
    }
    MembershipPlan {
        String id PK
        String name UK
        PlanType type
        PlanStatus status
        DateTime createdAt
    }
    Membership {
        String id PK
        String memberId FK
        String planId FK
        String paymentId FK
        DateTime startsOn
        DateTime endsOn
        Int creditsRemaining
        MembershipStatus status
        DateTime createdAt
    }
    MembershipRequest {
        String id PK
        String memberId FK
        String membershipId
        String planId FK
        String paymentId FK
        String status
        String createdById FK
        DateTime createdAt
    }
    Payment {
        String id PK
        String memberId FK
        Decimal amountUsd
        PaymentStatus status
        String registeredById FK
        DateTime createdAt
        String voidedById FK
    }
    Receipt {
        String id PK
        String paymentId FK
        BigInt number UK
    }
    User ||--o{ Membership : "contrata"}
    MembershipPlan ||--o{ Membership : "define"}
    Payment ||--o| Membership : "habilita"
    User ||--o{ MembershipRequest : "solicita"}
    MembershipPlan ||--o{ MembershipRequest : "selecciona"}
    Payment ||--o| MembershipRequest : "respalda"
    User ||--o{ Payment : "posee"}
    Payment ||--o| Receipt : "genera"
```

**Descripción de entidades**

| Modelo | Tabla PostgreSQL | Función |
|---|---|---|
| `MembershipPlan` | `membership_plans` | Catálogo de planes con modalidad, precio, vigencia y beneficios. |
| `Membership` | `memberships` | Períodos de membresía, saldo de créditos y vigencia. |
| `MembershipRequest` | `membership_requests` | Solicitudes de compra o renovación, ligadas a un plan, un miembro y un pago. |
| `Payment` | `payments` | Cobros con su concepto, importe, método, vencimiento y estado. |
| `Receipt` | `receipts` | Comprobante de un pago (uno por pago). |

### 3.3. Clases grupales, salas y reservas

```mermaid
erDiagram
    User {
        String id PK
    }
    Room {
        String id PK
        String name UK
    }
    ClassTemplate {
        String id PK
        String name
        String trainerId FK
        String roomId FK
        ClassStatus status
        DateTime createdAt
    }
    ClassSession {
        String id PK
        String classTemplateId FK
        String trainerId FK
        String roomId FK
        DateTime startsAt
        DateTime endsAt
        SessionStatus status
        String cancelledById FK
        DateTime createdAt
        String completedById FK
    }
    ClassReservation {
        String id PK
        String sessionId FK
        String memberId FK
        String membershipId FK
        ReservationStatus status
        DateTime createdAt
        String cancelledById FK
        String attendanceUpdatedById FK
    }
    Review {
        String id PK
        String sessionId FK
        String memberId FK
        Int rating
        DateTime createdAt
    }
    Room ||--o{ ClassTemplate : "aloja"}
    ClassTemplate ||--o{ ClassSession : "genera"}
    Room ||--o{ ClassSession : "recibe"}
    ClassSession ||--o{ ClassReservation : "contiene"}
    User ||--o{ ClassReservation : "reserva"}
    ClassSession ||--o{ Review : "recibe"}
    User ||--o{ Review : "realiza"}
```

**Descripción de entidades**

| Modelo | Tabla PostgreSQL | Función |
|---|---|---|
| `Room` | `rooms` | Salas del gimnasio y su capacidad. |
| `ClassTemplate` | `class_templates` | Configuración recurrente de una clase: entrenador, sala y horario. |
| `ClassSession` | `class_sessions` | Sesiones concretas de cada clase. |
| `ClassReservation` | `class_reservations` | Reservas de los miembros y su asistencia a las sesiones grupales. |
| `Review` | `reviews` | Calificaciones y comentarios de los miembros sobre las sesiones. |

### 3.4. Entrenadores y sesiones personales

```mermaid
erDiagram
    User {
        String id PK
    }
    TrainerSlot {
        String id PK
        String trainerId FK
        DateTime startsAt
        DateTime endsAt
        SlotStatus status
        DateTime createdAt
    }
    PersonalSession {
        String id PK
        String slotId FK
        String trainerId FK
        String memberId FK
        DateTime startsAt
        DateTime endsAt
        PersonalSessionStatus status
        String paymentId FK
        String cancelledById FK
        String markedById FK
    }
    TrainerMemberAssignment {
        String id PK
        String trainerId FK
        String memberId FK
        AssignmentStatus status
        DateTime createdAt
    }
    User ||--o{ TrainerSlot : "habilita"}
    TrainerSlot ||--o{ PersonalSession : "origina"}
    User ||--o{ PersonalSession : "participa"}
    User ||--o{ TrainerMemberAssignment : "asignado"}
```

**Descripción de entidades**

| Modelo | Tabla PostgreSQL | Función |
|---|---|---|
| `TrainerSlot` | `trainer_slots` | Bloques de horario que define cada entrenador. |
| `PersonalSession` | `personal_sessions` | Sesiones personales, su asistencia y el pago asociado, si lo hay. |
| `TrainerMemberAssignment` | `trainer_member_assignments` | Asignaciones entre entrenadores y miembros, con su estado. |

### 3.5. Ejercicios, rutinas y progreso

```mermaid
erDiagram
    User {
        String id PK
    }
    Exercise {
        String id PK
        String name UK
    }
    TrainingRoutine {
        String id PK
        String memberId FK
        String trainerId FK
        String name
        DateTime startsOn
        DateTime endsOn
        RoutineStatus status
        DateTime createdAt
    }
    RoutineExercise {
        String id PK
        String routineId FK
        String exerciseId FK
    }
    ProgressRecord {
        String id PK
        String memberId FK
        DateTime recordDate
        DateTime createdAt
    }
    ExerciseMark {
        String id PK
        String progressRecordId FK
        String exerciseId FK
    }
    User ||--o{ TrainingRoutine : "recibe"}
    TrainingRoutine ||--o{ RoutineExercise : "contiene"}
    Exercise ||--o{ RoutineExercise : "incluye"}
    User ||--o{ ProgressRecord : "registra"}
    ProgressRecord ||--o{ ExerciseMark : "contiene"}
    Exercise ||--o{ ExerciseMark : "mide"}
```

**Descripción de entidades**

| Modelo | Tabla PostgreSQL | Función |
|---|---|---|
| `Exercise` | `exercises` | Catálogo de ejercicios por grupo muscular. |
| `TrainingRoutine` | `training_routines` | Rutinas asignadas, con sus versiones y vigencia. |
| `RoutineExercise` | `routine_exercises` | Ejercicios de una rutina, con series y repeticiones. |
| `ProgressRecord` | `progress_records` | Mediciones físicas del miembro por fecha. |
| `ExerciseMark` | `exercise_marks` | Marcas de peso y repeticiones dentro de un registro de progreso. |

### 3.6. Máquinas y mantenimiento

```mermaid
erDiagram
    User {
        String id PK
    }
    Machine {
        String id PK
        String name UK
        String type
        MachineStatus status
        DateTime createdAt
    }
    MachineMaintenance {
        String id PK
        String machineId FK
        String createdById FK
        String closedById FK
        DateTime createdAt
    }
    MachineStatusChange {
        String id PK
        String machineId FK
        String changedById FK
    }
    Machine ||--o{ MachineMaintenance : "historial"}
    Machine ||--o{ MachineStatusChange : "cambios"}
    User ||--o{ MachineMaintenance : "registra"}
    User ||--o{ MachineStatusChange : "modifica"}
```

**Descripción de entidades**

| Modelo | Tabla PostgreSQL | Función |
|---|---|---|
| `Machine` | `machines` | Catálogo de equipos con su ubicación y estado. |
| `MachineMaintenance` | `machine_maintenances` | Mantenimientos registrados y quiénes los hicieron. |
| `MachineStatusChange` | `machine_status_changes` | Historial de cambios de estado de las máquinas. |

### 3.7. Ingresos, notificaciones y eventos

```mermaid
erDiagram
    User {
        String id PK
    }
    CheckIn {
        String id PK
        String memberId FK
        DateTime checkInDate
        String registeredById FK
        DateTime createdAt
    }
    Notification {
        String id PK
        String memberId FK
        String referenceId
        String dedupeKey
        NotificationStatus status
        DateTime createdAt
    }
    DomainEvent {
        String id PK
        String type
        String aggregateId
        String recipientId
        String dedupeKey UK
        DateTime processedAt
        DateTime createdAt
    }
    User ||--o{ CheckIn : "ingresa"}
    User ||--o{ Notification : "recibe"}
```

**Descripción de entidades**

| Modelo | Tabla PostgreSQL | Función |
|---|---|---|
| `CheckIn` | `check_ins` | Ingresos diarios y estado de la membresía al ingresar. |
| `Notification` | `notifications` | Avisos para los miembros, con su estado de lectura y control de duplicados. |
| `DomainEvent` | `domain_events` | Eventos pendientes o procesados que coordinan las notificaciones sin duplicarlas. |

## 4. Resumen de relaciones y reglas relevantes

- Un `User` tiene como máximo un `UserProfile` y un `MemberProfile`, y el número de miembro es único.
- Una `Membership` pertenece a un miembro, a un plan y a un pago. Una `MembershipRequest` también se relaciona con un miembro, un plan y un pago, y guarda el estado de la solicitud.
- Una `ClassSession` pertenece a una plantilla y a una sala, y puede tener varias reservas. `ClassReservation` evita duplicados por la combinación de sesión y miembro.
- Una `PersonalSession` corresponde a un espacio de entrenador y a un miembro. Que un espacio tenga una sola sesión `CONFIRMADA` se garantiza con un índice parcial.
- Una rutina agrupa ejercicios mediante `RoutineExercise`. El progreso del miembro incluye mediciones y marcas de ejercicios.
- Cada `Payment` tiene como máximo un `Receipt`, porque `paymentId` es único.
- `CheckIn` impide más de un ingreso por miembro en la misma fecha con `@@unique([memberId, checkInDate])`.
- `Notification` liga los avisos a los miembros y tiene una clave opcional para evitar duplicados. `DomainEvent` guarda eventos con una `dedupeKey` única y no tiene una relación `@relation` declarada con `User` en el esquema.

## 5. Enumeraciones principales

| Enum | Valores |
|---|---|
| `AssignmentStatus` | `ACTIVA`, `FINALIZADA` |
| `AttendanceStatus` | `PENDIENTE`, `ASISTIO`, `NO_ASISTIO` |
| `CheckInMembershipStatus` | `VIGENTE`, `VENCIDA`, `SIN_MEMBRESIA` |
| `MembershipStatus` | `VIGENTE`, `VENCIDA` |
| `ClassStatus` | `ACTIVA`, `INACTIVA` |
| `MachineStatus` | `DISPONIBLE`, `EN_MANTENIMIENTO`, `FUERA_SERVICIO` |
| `NotificationModule` | `MEMBRESIAS`, `RESERVAS`, `PAGOS`, `SISTEMA` |
| `NotificationStatus` | `NO_LEIDA`, `LEIDA` |
| `PaymentConcept` | `MEMBRESIA`, `SESION_ADICIONAL`, `SESION_PERSONAL` |
| `PaymentMethod` | `EFECTIVO`, `TARJETA` |
| `PaymentStatus` | `PENDIENTE`, `PAGADO`, `ANULADO` |
| `PersonalSessionStatus` | `CONFIRMADA`, `CANCELADA`, `COMPLETADA` |
| `PlanStatus` | `ACTIVO`, `INACTIVO` |
| `PlanType` | `MONTHLY`, `QUARTERLY`, `BY_CLASSES` |
| `ReservationStatus` | `CONFIRMADA`, `CANCELADA`, `CANCELADA_POR_GIMNASIO` |
| `RoutineStatus` | `VIGENTE`, `REEMPLAZADA`, `FINALIZADA` |
| `SessionStatus` | `PROGRAMADA`, `EN_CURSO`, `COMPLETADA`, `CANCELADA` |
| `SlotStatus` | `LIBRE`, `RESERVADO` |
| `UserRole` | `MIEMBRO`, `ENTRENADOR`, `RECEPCION_ADMIN` |

