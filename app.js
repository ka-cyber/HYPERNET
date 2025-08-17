// HYPERNET Mission Control Application
class HypernetMissionControl {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.earth = null;
        this.satellites = [];
        this.uavs = [];
        this.groundStations = [];
        this.animationId = null;
        this.selectedObject = null;
        this.cameraMode = 'earth';
        this.followTarget = null;
        this.simulationSpeed = 1;
        this.isPaused = false;
        this.missionStartTime = Date.now();
        this.telemetryTimer = null;
        
        // Network data
        this.networkData = {
            avg_throughput_mbps: 1511.61,
            avg_latency_ms: 20.76,
            packet_delivery_ratio: 99.9,
            energy_efficiency: 2.61,
            optimization_score: 0.875
        };
        
        this.init();
    }
    
    init() {
        this.setupThreeJS();
        this.createEarth();
        this.createSatellites();
        this.createUAVs();
        this.createGroundStations();
        this.setupControls();
        this.setupEventListeners();
        this.startMissionClock();
        this.startTelemetryFeed();
        this.startNetworkDataUpdate();
        this.animate();
    }
    
    setupThreeJS() {
        const container = document.getElementById('threeContainer');
        
        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000511);
        
        // Camera
        this.camera = new THREE.PerspectiveCamera(
            45, 
            container.clientWidth / container.clientHeight, 
            1, 
            50000
        );
        this.camera.position.set(0, 0, 2500);
        
        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        container.appendChild(this.renderer.domElement);
        
        // Lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
        directionalLight.position.set(2000, 1000, 2000);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);
        
        // Point light for better visibility
        const pointLight = new THREE.PointLight(0xffffff, 0.8, 10000);
        pointLight.position.set(1000, 1000, 1000);
        this.scene.add(pointLight);
        
        // Starfield
        this.createStarfield();
        
        // Handle resize
        window.addEventListener('resize', () => this.onWindowResize());
    }
    
    createStarfield() {
        const starsGeometry = new THREE.BufferGeometry();
        const starsCount = 5000;
        const positions = new Float32Array(starsCount * 3);
        
        for (let i = 0; i < starsCount * 3; i++) {
            positions[i] = (Math.random() - 0.5) * 20000;
        }
        
        starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const starsMaterial = new THREE.PointsMaterial({ 
            color: 0xffffff, 
            size: 1,
            transparent: true,
            opacity: 0.6
        });
        const stars = new THREE.Points(starsGeometry, starsMaterial);
        this.scene.add(stars);
    }
    
    createEarth() {
        // Main Earth sphere
        const earthGeometry = new THREE.SphereGeometry(300, 64, 64);
        const earthMaterial = new THREE.MeshPhongMaterial({
            color: 0x2194CE,
            transparent: false,
            shininess: 10
        });
        
        this.earth = new THREE.Mesh(earthGeometry, earthMaterial);
        this.earth.receiveShadow = true;
        this.scene.add(this.earth);
        
        // Add continent outlines
        const wireframeGeometry = new THREE.SphereGeometry(302, 32, 32);
        const wireframeMaterial = new THREE.MeshBasicMaterial({
            color: 0x32B8C6,
            wireframe: true,
            transparent: true,
            opacity: 0.3
        });
        const wireframe = new THREE.Mesh(wireframeGeometry, wireframeMaterial);
        this.scene.add(wireframe);
        
        // Add atmosphere glow
        const atmosphereGeometry = new THREE.SphereGeometry(320, 64, 64);
        const atmosphereMaterial = new THREE.MeshPhongMaterial({
            color: 0x32B8C6,
            transparent: true,
            opacity: 0.15,
            side: THREE.BackSide
        });
        const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
        this.scene.add(atmosphere);
    }
    
    createSatellites() {
        // Create more visible satellite geometry
        const satelliteGeometry = new THREE.BoxGeometry(8, 4, 2);
        const satelliteMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x00d4ff,
            emissive: 0x001122,
            shininess: 100
        });
        
        // Add solar panels
        const panelGeometry = new THREE.BoxGeometry(12, 8, 0.5);
        const panelMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x333333,
            emissive: 0x000055
        });
        
        for (let i = 0; i < 100; i++) {
            const satelliteGroup = new THREE.Group();
            
            // Main body
            const satellite = new THREE.Mesh(satelliteGeometry, satelliteMaterial.clone());
            satelliteGroup.add(satellite);
            
            // Solar panels
            const panel1 = new THREE.Mesh(panelGeometry, panelMaterial.clone());
            panel1.position.set(-10, 0, 0);
            satelliteGroup.add(panel1);
            
            const panel2 = new THREE.Mesh(panelGeometry, panelMaterial.clone());
            panel2.position.set(10, 0, 0);
            satelliteGroup.add(panel2);
            
            // Orbital parameters
            const altitude = 150 + Math.random() * 100; // Reduced altitude for visibility
            const inclination = Math.random() * Math.PI;
            const longitude = Math.random() * 2 * Math.PI;
            const anomaly = Math.random() * 2 * Math.PI;
            
            satelliteGroup.userData = {
                id: `SAT-${i.toString().padStart(3, '0')}`,
                type: 'satellite',
                altitude: 538.9 + Math.random() * (565.4 - 538.9),
                inclination: inclination,
                longitude: longitude,
                anomaly: anomaly,
                speed: 0.005 + Math.random() * 0.005,
                status: i < 93 ? 'operational' : 'maintenance',
                linkQuality: 0.8 + Math.random() * 0.2,
                orbitalRadius: 300 + altitude
            };
            
            // Set material color based on status
            if (satelliteGroup.userData.status === 'maintenance') {
                satellite.material.color.setHex(0xff6b6b);
                satellite.material.emissive.setHex(0x220000);
            }
            
            this.updateSatellitePosition(satelliteGroup);
            this.satellites.push(satelliteGroup);
            this.scene.add(satelliteGroup);
        }
    }
    
    updateSatellitePosition(satelliteGroup) {
        const { orbitalRadius, anomaly, inclination, longitude } = satelliteGroup.userData;
        
        const x = orbitalRadius * Math.cos(anomaly) * Math.cos(longitude);
        const y = orbitalRadius * Math.sin(anomaly) * Math.sin(inclination);
        const z = orbitalRadius * Math.cos(anomaly) * Math.sin(longitude);
        
        satelliteGroup.position.set(x, y, z);
        satelliteGroup.lookAt(0, 0, 0);
    }
    
    createUAVs() {
        // Create more visible UAV geometry
        const uavGeometry = new THREE.ConeGeometry(4, 8, 6);
        const uavMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xffc185,
            emissive: 0x221100
        });
        
        // Create propeller geometry
        const propGeometry = new THREE.CylinderGeometry(0.5, 0.5, 6, 3);
        const propMaterial = new THREE.MeshPhongMaterial({ color: 0x666666 });
        
        for (let i = 0; i < 25; i++) {
            const uavGroup = new THREE.Group();
            
            // Main body
            const uav = new THREE.Mesh(uavGeometry, uavMaterial.clone());
            uavGroup.add(uav);
            
            // Add propellers
            for (let j = 0; j < 4; j++) {
                const prop = new THREE.Mesh(propGeometry, propMaterial.clone());
                const angle = (j * Math.PI * 2) / 4;
                prop.position.set(Math.cos(angle) * 6, 2, Math.sin(angle) * 6);
                prop.rotation.x = Math.PI / 2;
                uavGroup.add(prop);
            }
            
            // Position around Boston area at low altitude
            const angle = (i / 25) * Math.PI * 2;
            const radius = 350 + Math.random() * 50; // Close to Earth surface
            const x = radius * Math.cos(angle) * Math.cos(0.7); // Boston latitude approx
            const y = radius * Math.sin(0.7) + (Math.random() - 0.5) * 20;
            const z = radius * Math.sin(angle) * Math.cos(0.7);
            
            uavGroup.position.set(x, y, z);
            uavGroup.lookAt(0, 0, 0);
            
            uavGroup.userData = {
                id: `UAV-${i + 1}`,
                type: 'uav',
                battery: 70 + Math.random() * 30,
                accuracy: 85 + Math.random() * 15,
                processing: 25 + Math.random() * 10,
                mission: ['reconnaissance', 'relay', 'monitoring'][Math.floor(Math.random() * 3)],
                status: 'active',
                basePosition: { x, y, z },
                patrolRadius: 15 + Math.random() * 20,
                rotationSpeed: 0.01 + Math.random() * 0.02
            };
            
            this.uavs.push(uavGroup);
            this.scene.add(uavGroup);
        }
    }
    
    createGroundStations() {
        const stationGeometry = new THREE.CylinderGeometry(6, 12, 20, 8);
        const stationMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x964325,
            emissive: 0x110000
        });
        
        // Antenna dish geometry
        const dishGeometry = new THREE.SphereGeometry(15, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
        const dishMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xcccccc,
            side: THREE.DoubleSide
        });
        
        // Major ground station locations
        const stations = [
            { name: 'Boston', lat: 42.3601, lon: -71.0589 },
            { name: 'MIT', lat: 42.3598, lon: -71.0921 },
            { name: 'New York', lat: 40.7128, lon: -74.0060 },
            { name: 'Los Angeles', lat: 34.0522, lon: -118.2437 },
            { name: 'Miami', lat: 25.7617, lon: -80.1918 }
        ];
        
        stations.forEach((stationData, i) => {
            const stationGroup = new THREE.Group();
            
            // Main tower
            const station = new THREE.Mesh(stationGeometry, stationMaterial.clone());
            stationGroup.add(station);
            
            // Antenna dish
            const dish = new THREE.Mesh(dishGeometry, dishMaterial.clone());
            dish.position.set(0, 25, 0);
            dish.rotation.x = -Math.PI / 4;
            stationGroup.add(dish);
            
            const lat = stationData.lat * Math.PI / 180;
            const lon = stationData.lon * Math.PI / 180;
            const radius = 310; // Just above Earth surface
            
            const x = radius * Math.cos(lat) * Math.cos(lon);
            const y = radius * Math.sin(lat);
            const z = radius * Math.cos(lat) * Math.sin(lon);
            
            stationGroup.position.set(x, y, z);
            stationGroup.lookAt(0, 0, 0);
            
            stationGroup.userData = {
                id: `GS-${stationData.name}`,
                type: 'groundStation',
                name: stationData.name,
                status: i < 4 ? 'operational' : 'maintenance',
                capacity: 9000 + Math.random() * 2000,
                utilization: 5000 + Math.random() * 3000,
                qosScore: 0.85 + Math.random() * 0.15
            };
            
            // Set material color based on status
            if (stationGroup.userData.status === 'maintenance') {
                station.material.color.setHex(0x663333);
            }
            
            this.groundStations.push(stationGroup);
            this.scene.add(stationGroup);
        });
    }
    
    setupControls() {
        // Camera view controls
        document.querySelectorAll('[data-view]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.target.dataset.view;
                this.setCameraMode(view);
                
                // Update active button
                document.querySelectorAll('[data-view]').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            });
        });
        
        // Overlay controls
        document.getElementById('coverageOverlay').addEventListener('change', (e) => {
            this.toggleOverlay('coverage', e.target.checked);
        });
        
        // Simulation controls
        document.getElementById('playPauseBtn').addEventListener('click', () => {
            this.toggleSimulation();
        });
        
        document.getElementById('speedControl').addEventListener('change', (e) => {
            this.simulationSpeed = parseFloat(e.target.value);
        });
        
        // Export data
        document.getElementById('exportData').addEventListener('click', () => {
            this.exportPerformanceData();
        });
        
        // Modal controls
        document.getElementById('closeModal').addEventListener('click', () => {
            this.closeModal();
        });
        
        // Object info
        document.getElementById('closeInfo').addEventListener('click', () => {
            this.closeObjectInfo();
        });
    }
    
    setupEventListeners() {
        // Mouse interaction for object selection
        this.renderer.domElement.addEventListener('click', (event) => {
            this.onMouseClick(event);
        });
        
        // Mouse move for hover effects
        this.renderer.domElement.addEventListener('mousemove', (event) => {
            this.onMouseMove(event);
        });
    }
    
    onMouseClick(event) {
        const mouse = new THREE.Vector2();
        const rect = this.renderer.domElement.getBoundingClientRect();
        
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, this.camera);
        
        const intersectables = [...this.satellites, ...this.uavs, ...this.groundStations];
        const intersects = raycaster.intersectObjects(intersectables, true);
        
        if (intersects.length > 0) {
            // Find the parent group
            let object = intersects[0].object;
            while (object.parent && !object.userData.type) {
                object = object.parent;
            }
            if (object.userData.type) {
                this.showObjectInfo(object);
            }
        }
    }
    
    onMouseMove(event) {
        const mouse = new THREE.Vector2();
        const rect = this.renderer.domElement.getBoundingClientRect();
        
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, this.camera);
        
        const intersectables = [...this.satellites, ...this.uavs, ...this.groundStations];
        const intersects = raycaster.intersectObjects(intersectables, true);
        
        // Reset all objects to normal scale
        intersectables.forEach(obj => {
            obj.scale.setScalar(1);
        });
        
        if (intersects.length > 0) {
            let object = intersects[0].object;
            while (object.parent && !object.userData.type) {
                object = object.parent;
            }
            if (object.userData.type) {
                object.scale.setScalar(1.3);
                this.renderer.domElement.style.cursor = 'pointer';
            }
        } else {
            this.renderer.domElement.style.cursor = 'default';
        }
    }
    
    setCameraMode(mode) {
        this.cameraMode = mode;
        this.followTarget = null;
        
        switch (mode) {
            case 'earth':
                // Earth overview - will be handled in updateCamera
                break;
            case 'satellite':
                if (this.satellites.length > 0) {
                    this.followTarget = this.satellites[Math.floor(Math.random() * this.satellites.length)];
                }
                break;
            case 'uav':
                if (this.uavs.length > 0) {
                    this.followTarget = this.uavs[Math.floor(Math.random() * this.uavs.length)];
                }
                break;
        }
    }
    
    updateCamera() {
        const time = Date.now() * 0.0005;
        
        switch (this.cameraMode) {
            case 'earth':
                // Orbit around Earth
                this.camera.position.x = Math.cos(time) * 1800;
                this.camera.position.y = Math.sin(time * 0.5) * 800;
                this.camera.position.z = Math.sin(time) * 1800;
                this.camera.lookAt(0, 0, 0);
                break;
            case 'satellite':
                if (this.followTarget) {
                    const target = this.followTarget.position;
                    const offset = new THREE.Vector3(80, 40, 80);
                    this.camera.position.copy(target).add(offset);
                    this.camera.lookAt(target);
                }
                break;
            case 'uav':
                if (this.followTarget) {
                    const target = this.followTarget.position;
                    const offset = new THREE.Vector3(50, 30, 50);
                    this.camera.position.copy(target).add(offset);
                    this.camera.lookAt(target);
                }
                break;
        }
    }
    
    showObjectInfo(object) {
        const infoPanel = document.getElementById('objectInfo');
        const title = document.getElementById('objectTitle');
        const content = document.getElementById('infoContent');
        
        title.textContent = object.userData.id;
        
        let html = '';
        const data = object.userData;
        
        switch (data.type) {
            case 'satellite':
                html = `
                    <div style="margin-bottom: 8px;"><strong>Type:</strong> Satellite</div>
                    <div style="margin-bottom: 8px;"><strong>Status:</strong> <span style="color: ${data.status === 'operational' ? '#32B8C6' : '#ff6b6b'}">${data.status}</span></div>
                    <div style="margin-bottom: 8px;"><strong>Altitude:</strong> ${data.altitude.toFixed(1)} km</div>
                    <div style="margin-bottom: 8px;"><strong>Link Quality:</strong> ${(data.linkQuality * 100).toFixed(1)}%</div>
                    <div><strong>Orbital Speed:</strong> ${(data.speed * 100).toFixed(2)} units/s</div>
                `;
                break;
            case 'uav':
                html = `
                    <div style="margin-bottom: 8px;"><strong>Type:</strong> UAV</div>
                    <div style="margin-bottom: 8px;"><strong>Status:</strong> <span style="color: #32B8C6">${data.status}</span></div>
                    <div style="margin-bottom: 8px;"><strong>Battery:</strong> ${data.battery.toFixed(1)}%</div>
                    <div style="margin-bottom: 8px;"><strong>Accuracy:</strong> ${data.accuracy.toFixed(1)}%</div>
                    <div style="margin-bottom: 8px;"><strong>Processing:</strong> ${data.processing.toFixed(1)} GFLOPS</div>
                    <div><strong>Mission:</strong> ${data.mission}</div>
                `;
                break;
            case 'groundStation':
                html = `
                    <div style="margin-bottom: 8px;"><strong>Type:</strong> Ground Station</div>
                    <div style="margin-bottom: 8px;"><strong>Location:</strong> ${data.name}</div>
                    <div style="margin-bottom: 8px;"><strong>Status:</strong> <span style="color: ${data.status === 'operational' ? '#32B8C6' : '#ff6b6b'}">${data.status}</span></div>
                    <div style="margin-bottom: 8px;"><strong>Capacity:</strong> ${data.capacity.toFixed(0)} Mbps</div>
                    <div style="margin-bottom: 8px;"><strong>Utilization:</strong> ${data.utilization.toFixed(0)} Mbps</div>
                    <div><strong>QoS Score:</strong> ${(data.qosScore * 100).toFixed(1)}%</div>
                `;
                break;
        }
        
        content.innerHTML = html;
        infoPanel.classList.remove('hidden');
        this.selectedObject = object;
        
        // Highlight selected object
        object.scale.setScalar(1.5);
    }
    
    closeObjectInfo() {
        document.getElementById('objectInfo').classList.add('hidden');
        if (this.selectedObject) {
            this.selectedObject.scale.setScalar(1);
            this.selectedObject = null;
        }
    }
    
    toggleSimulation() {
        this.isPaused = !this.isPaused;
        const btn = document.getElementById('playPauseBtn');
        btn.textContent = this.isPaused ? '▶️' : '⏸️';
    }
    
    startMissionClock() {
        const updateClock = () => {
            if (!this.isPaused) {
                const elapsed = Math.floor((Date.now() - this.missionStartTime) / 1000);
                const hours = Math.floor(elapsed / 3600).toString().padStart(2, '0');
                const minutes = Math.floor((elapsed % 3600) / 60).toString().padStart(2, '0');
                const seconds = (elapsed % 60).toString().padStart(2, '0');
                
                document.getElementById('missionClock').textContent = `${hours}:${minutes}:${seconds}`;
            }
            requestAnimationFrame(updateClock);
        };
        updateClock();
    }
    
    startTelemetryFeed() {
        const messages = [
            'Satellite link established successfully',
            'UAV mission waypoint reached',
            'Ground station handoff completed',
            'Network optimization cycle started',
            'Federated learning round completed',
            'Physics-informed routing updated',
            'RLNC decoding successful',
            'Coverage area optimized',
            'Bandwidth allocation adjusted',
            'Quality of service maintained',
            'Satellite constellation realigned',
            'UAV swarm formation updated',
            'Cross-layer optimization active',
            'Latency threshold maintained',
            'Throughput targets achieved'
        ];
        
        const addTelemetryItem = () => {
            if (this.isPaused) return;
            
            const feed = document.getElementById('telemetryFeed');
            const now = new Date();
            const time = now.toTimeString().split(' ')[0];
            const message = messages[Math.floor(Math.random() * messages.length)];
            
            const item = document.createElement('div');
            item.className = 'telemetry-item';
            item.innerHTML = `
                <span class="telemetry-time">${time}</span>
                <span class="telemetry-msg">${message}</span>
            `;
            
            feed.insertBefore(item, feed.firstChild);
            
            // Remove old items
            while (feed.children.length > 12) {
                feed.removeChild(feed.lastChild);
            }
        };
        
        // Add initial items
        for (let i = 0; i < 4; i++) {
            setTimeout(() => addTelemetryItem(), i * 500);
        }
        
        // Add new telemetry item every 2-5 seconds
        const scheduleNext = () => {
            const delay = 2000 + Math.random() * 3000;
            setTimeout(() => {
                addTelemetryItem();
                scheduleNext();
            }, delay);
        };
        scheduleNext();
    }
    
    startNetworkDataUpdate() {
        const updateMetrics = () => {
            if (!this.isPaused) {
                // Simulate real-time data variations
                const throughputVar = (Math.random() - 0.5) * 200;
                const latencyVar = (Math.random() - 0.5) * 5;
                const optimizationVar = (Math.random() - 0.5) * 0.1;
                
                const throughput = Math.max(0, this.networkData.avg_throughput_mbps + throughputVar);
                const latency = Math.max(1, this.networkData.avg_latency_ms + latencyVar);
                const optimization = Math.max(0, Math.min(1, this.networkData.optimization_score + optimizationVar)) * 100;
                
                document.getElementById('throughput').textContent = `${throughput.toFixed(2)} Mbps`;
                document.getElementById('latency').textContent = `${latency.toFixed(2)} ms`;
                document.getElementById('optimization').textContent = `${optimization.toFixed(1)}%`;
            }
        };
        
        // Update every 2 seconds
        setInterval(updateMetrics, 2000);
    }
    
    exportPerformanceData() {
        const data = {
            timestamp: new Date().toISOString(),
            mission_time: document.getElementById('missionClock').textContent,
            network_performance: {
                throughput: document.getElementById('throughput').textContent,
                latency: document.getElementById('latency').textContent,
                packet_delivery: document.getElementById('packetDelivery').textContent,
                optimization: document.getElementById('optimization').textContent
            },
            satellite_status: {
                total: this.satellites.length,
                operational: this.satellites.filter(s => s.userData.status === 'operational').length,
                maintenance: this.satellites.filter(s => s.userData.status === 'maintenance').length
            },
            uav_status: {
                total: this.uavs.length,
                active: this.uavs.filter(u => u.userData.status === 'active').length
            },
            ground_stations: {
                total: this.groundStations.length,
                operational: this.groundStations.filter(g => g.userData.status === 'operational').length
            },
            simulation_state: {
                speed: this.simulationSpeed,
                paused: this.isPaused,
                camera_mode: this.cameraMode
            }
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `hypernet_performance_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        // Show feedback
        const btn = document.getElementById('exportData');
        const originalText = btn.textContent;
        btn.textContent = '✅ Exported';
        setTimeout(() => {
            btn.textContent = originalText;
        }, 2000);
    }
    
    closeModal() {
        document.getElementById('chartsModal').classList.add('hidden');
    }
    
    toggleOverlay(type, enabled) {
        // Placeholder for overlay functionality
        console.log(`Toggle ${type} overlay: ${enabled}`);
        // In a real application, this would toggle visibility of overlay elements
    }
    
    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());
        
        if (!this.isPaused) {
            const deltaTime = this.simulationSpeed;
            
            // Update satellite positions
            this.satellites.forEach(satellite => {
                satellite.userData.anomaly += satellite.userData.speed * deltaTime;
                this.updateSatellitePosition(satellite);
                
                // Rotate satellite
                satellite.rotation.y += 0.01 * deltaTime;
            });
            
            // Update UAV positions (patrol movement)
            const time = Date.now() * 0.001 * this.simulationSpeed;
            this.uavs.forEach((uav, index) => {
                const { basePosition, patrolRadius, rotationSpeed } = uav.userData;
                const phaseOffset = index * 0.5;
                
                const offsetX = Math.sin(time * rotationSpeed + phaseOffset) * patrolRadius;
                const offsetY = Math.cos(time * rotationSpeed * 0.7 + phaseOffset) * patrolRadius * 0.3;
                const offsetZ = Math.cos(time * rotationSpeed + phaseOffset) * patrolRadius;
                
                uav.position.set(
                    basePosition.x + offsetX,
                    basePosition.y + offsetY,
                    basePosition.z + offsetZ
                );
                
                // Make UAV face movement direction
                const direction = new THREE.Vector3(offsetX, offsetY, offsetZ).normalize();
                uav.lookAt(uav.position.clone().add(direction));
                
                // Rotate propellers
                uav.children.forEach((child, childIndex) => {
                    if (childIndex > 0) { // Skip main body
                        child.rotation.y += 0.5 * deltaTime;
                    }
                });
            });
            
            // Rotate Earth
            this.earth.rotation.y += 0.005 * deltaTime;
        }
        
        this.updateCamera();
        this.renderer.render(this.scene, this.camera);
    }
    
    onWindowResize() {
        const container = document.getElementById('threeContainer');
        this.camera.aspect = container.clientWidth / container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(container.clientWidth, container.clientHeight);
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    const missionControl = new HypernetMissionControl();
    
    // Add click handler for performance charts to open modal
    document.querySelectorAll('.performance-chart').forEach(chart => {
        chart.addEventListener('click', () => {
            document.getElementById('chartsModal').classList.remove('hidden');
        });
    });
    
    // Add fullscreen functionality
    document.getElementById('fullscreenBtn').addEventListener('click', () => {
        const container = document.getElementById('threeContainer');
        if (container.requestFullscreen) {
            container.requestFullscreen();
        } else if (container.webkitRequestFullscreen) {
            container.webkitRequestFullscreen();
        } else if (container.mozRequestFullScreen) {
            container.mozRequestFullScreen();
        }
    });
});

// Global error handling
window.addEventListener('error', (event) => {
    console.error('Application error:', event.error);
});

// Prevent context menu on 3D canvas
document.addEventListener('contextmenu', (e) => {
    if (e.target.tagName === 'CANVAS') {
        e.preventDefault();
    }
});