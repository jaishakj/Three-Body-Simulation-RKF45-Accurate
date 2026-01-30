# Three-Body Problem Simulator (RKF45)

A browser-based three-body gravitational simulator that visualizes how simple Newtonian gravity produces complex and chaotic motion.

This project uses an **adaptive Runge–Kutta–Fehlberg (RKF45) integrator** to solve the classical three-body problem in **normalized astronomical units**, with real-time rendering and numerical diagnostics.

![Simulation Screenshot](./image.png)

---

## Features

- Adaptive **RKF45 (4th/5th order) numerical integration**
- Normalized Newtonian gravity (G = 1)
- Multiple well-known scenarios:
  - Figure-eight orbit (Chenciner–Montgomery)
  - Burrau’s Pythagorean three-body problem
  - Star–planet–moon system
  - Lagrange L4/L5 configuration
- Real-time diagnostics:
  - Total energy
  - Relative energy drift (ΔE / E₀)
  - Adaptive timestep (dt)
  - Step acceptance rate
- Interactive controls:
  - Time scaling
  - Error tolerance
  - Pause / resume
  - Preset switching
- Particle trails with fading for orbit visualization

---

## Physics Model

- Classical Newtonian gravity in 2D
- Point masses with configurable mass ratios
- No relativistic corrections
- Optional numerical softening for close encounters (used internally for stability)

The simulator emphasizes **short-term numerical accuracy and transparency**, allowing users to observe both stable and chaotic dynamics as well as numerical error growth.

---

## Numerical Method

The system is integrated using the **Runge–Kutta–Fehlberg (RKF45)** method with adaptive timestep control:

- 4th- and 5th-order solutions are compared each step
- Local truncation error determines timestep acceptance
- Timestep increases or decreases dynamically based on error

This approach provides high accuracy for short-to-medium time spans, while making numerical drift visible rather than hiding it.

---
