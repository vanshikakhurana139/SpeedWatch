import { Accelerometer } from 'expo-sensors';

class AccelerometerService {
    constructor() {
        this.subscription = null;
        this.previousAcceleration = { x: 0, y: 0, z: 0 };
        this.harshDrivingCallback = null;
    }

    // Start monitoring accelerometer
    start(onHarshDriving) {
        this.harshDrivingCallback = onHarshDriving;

        // Set update interval to 100ms
        Accelerometer.setUpdateInterval(100);

        this.subscription = Accelerometer.addListener((accelerometerData) => {
            const { x, y, z } = accelerometerData;

            // Calculate delta (change) in acceleration
            const deltaX = Math.abs(x - this.previousAcceleration.x);
            const deltaY = Math.abs(y - this.previousAcceleration.y);
            const deltaZ = Math.abs(z - this.previousAcceleration.z);

            // Calculate total g-force change
            const totalDelta = Math.sqrt(deltaX ** 2 + deltaY ** 2 + deltaZ ** 2);

            // Thresholds from blueprint:
            // Hard brake: > 0.4g sustained
            // Harsh acceleration: > 0.3g sustained

            // We'll use a simpler threshold: > 0.35g for any harsh movement
            if (totalDelta > 0.35) {
                // Determine if it's braking or acceleration based on Y axis
                // (Y is typically forward/backward in phone orientation)
                const type = deltaY > deltaX && deltaY > deltaZ
                    ? (y > this.previousAcceleration.y ? 'harsh_accel' : 'hard_brake')
                    : 'harsh_movement';

                this.harshDrivingCallback?.({
                    type,
                    gForce: totalDelta.toFixed(2),
                    timestamp: Date.now(),
                });
            }

            this.previousAcceleration = { x, y, z };
        });
    }

    // Stop monitoring
    stop() {
        if (this.subscription) {
            this.subscription.remove();
            this.subscription = null;
        }
        this.previousAcceleration = { x: 0, y: 0, z: 0 };
    }
}

export default new AccelerometerService();