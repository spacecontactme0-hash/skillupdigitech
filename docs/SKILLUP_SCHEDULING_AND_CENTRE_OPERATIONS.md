# SKILLUP DIGITECH ACADEMY — SCHEDULING & PHYSICAL CENTRE OPERATIONS SPECIFICATION

> **Document ID:** SDA-OPS-005  
> **Version:** 1.0.0  
> **Status:** Proposed — For Architecture Review & Management Approval  
> **Date:** 15 November 2026  
> **Platform:** SkillUp Digitech Academy (`skillup-digitech.com.ng`)  

---

## 1. Physical Learning Centre Overview

SkillUp Digitech Academy operates a modern technology learning centre designed for intensive practical instruction, coding labs, and mentor-led workshops. The initial operational implementation configures **one physical centre** (Enugu Campus), while maintaining full architectural support for future multi-campus expansion.

### Centre Facility Matrix

| Facility Domain | Academy Obligation & Standard | Student Obligation |
| :--- | :--- | :--- |
| **Laptops / Computing** | **None.** The academy does **not** provide student workstations. | **Mandatory BYOL:** Students must bring their own suitable laptop to every physical class. |
| **Power / Electricity** | **Guaranteed Uninterrupted Power:** Dual-source setup (National Grid + Automated Solar Inverter + Backup Generator). | Bring proper power adapter and charger for their device. |
| **Internet Connectivity** | **Enterprise High-Speed Wi-Fi:** Dedicated fibre connection with student portal bandwidth allocation. | Ensure device Wi-Fi card supports standard IEEE 802.11ac/ax. |
| **Workstation Environment** | Ergonomic seating, clean power benches, climate-controlled labs (AC). | Maintain professional lab conduct and workstation cleanliness. |

---

## 2. Bring Your Own Laptop (BYOL) Operational Standard

### 2.1 Device Requirement Guidelines
The academy publishes recommended minimum hardware specifications for each programme pathway:

- **AI Engineer / Software Engineer:**
  - *OS:* Windows 11 (64-bit), macOS 13+, or Ubuntu Linux 22.04 LTS.
  - *Processor:* Intel Core i5 (8th Gen+) / AMD Ryzen 5 / Apple Silicon (M1+).
  - *Memory:* 8GB RAM minimum (16GB recommended for Docker / Local LLMs).
  - *Storage:* 256GB SSD minimum (at least 30GB free space).
- **Graphic Design / Video Editing / Social Media Management:**
  - *Memory:* 16GB RAM recommended.
  - *Display:* Minimum 1080p resolution with accurate color rendering.

### 2.2 Enrolment Acknowledgement Protocol
Before a student can be enrolled into any hybrid cohort or book a physical practical session, the student must complete the legal BYOL acknowledgement:
> *"I understand that I am required to bring my own suitable laptop for physical classes at SkillUp Digitech Academy. I understand that the academy provides electricity and internet connectivity at its physical learning centre but does not guarantee a laptop for my use."*

The timestamp, user ID, IP address, and policy version are permanently immutably logged in `policy_acknowledgements`.

---

## 3. Hybrid Fixed Timetable Policy

### 3.1 Academy-Assigned Cohort Schedules
Hybrid cohorts operate on a **fixed academic timetable**. Students cannot customize or pick arbitrary days for their physical classes during registration. 

**Standard Hybrid Cohort Timetable Example:**
- **Wednesday (17:00 – 19:00 UTC+1):** Live Virtual Technical Lecture & Architecture Walkthrough (Synchronous Online).
- **Saturday (10:00 – 14:00 UTC+1):** Compulsory Physical Lab Workshop & Collaborative Coding (In-Person Centre).
- **Monday – Friday (Self-Paced):** Recorded instructor lesson modules, readings, and coding exercises.

### 3.2 Timetable Change & Notification Rules
If an authorized administrator reschedules or cancels a class session:
1. The original session details, author, and timestamp are preserved in an audit log (`admin_logs`).
2. The `class_sessions` record is updated with status `rescheduled` or `cancelled` with a mandatory `change_reason`.
3. An automated Brevo transactional notification is queued immediately for all active cohort members.
4. The student dashboard displays an alert banner on the session card.

---

## 4. Physical Centre Capacity & Concurrency Management

### 4.1 Safe Seating Capacity Calculation
Capacity is calculated strictly from physical room dimensions, usable desks, safe egress routes, and power outlet distribution:
$$\text{Max Physical Capacity} = \min(\text{Usable Seating}, \text{Power Drop Outlets}, \text{Safe Lab Limit})$$
Online enrollment numbers are decoupled from this calculation and cannot be used to inflate physical capacity.

### 4.2 Race Condition & Double-Booking Prevention
When a student registers for a hybrid cohort or reserves an optional physical workshop, the seat reservation executes inside an atomic PostgreSQL transaction:
```sql
SELECT booked_seats_count, max_capacity 
FROM class_sessions 
WHERE id = $sessionId 
FOR UPDATE;

-- If booked_seats_count < max_capacity:
-- increment booked_seats_count and insert session_booking
```
If the capacity is exhausted, the reservation fails gracefully, and the student is informed that the physical cohort is full, offering an online cohort alternative.

---

## 5. Attendance Management & Academic Treatment

| Activity Type | Channel | Verification Method | Academic Attendance Value |
| :--- | :--- | :--- | :--- |
| **Recorded Video** | Asynchronous Web Player | Video heartbeat ping tracking 90%+ duration. | Counts toward **Course Progress**, NOT live attendance. |
| **Live Virtual Class** | Zoom / Google Meet / Jitsi | Meeting room attendance log & instructor verification. | Counts toward **Live Attendance**. |
| **Physical Lab Class**| Physical Lab Venue | Instructor roster check / Student QR scan verified by instructor. | Counts toward **Physical Attendance Requirement** (min 75% required for graduation). |
| **Optional Workshop**| Physical Lab Venue | Booking reservation check-in by instructor. | Associated with course enrolment as supplemental practical credit. |

Watching a recorded video can **never** be used to overwrite or satisfy a missed physical class attendance requirement.
