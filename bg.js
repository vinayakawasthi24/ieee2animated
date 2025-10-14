 // Neural Network Code (same as provided)
        import * as THREE from 'three';
        import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
        import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
        import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
        import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
        import { FilmPass } from 'three/addons/postprocessing/FilmPass.js';
        import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

        const config = {
            paused: false,
            activePaletteIndex: 1,
            currentFormation: 0,
            numFormations: 4,
            densityFactor: 1
        };

        const colorPalettes = [
            [new THREE.Color(0x4F46E5), new THREE.Color(0x7C3AED), new THREE.Color(0xC026D3), new THREE.Color(0xDB2777), new THREE.Color(0x8B5CF6)],
            [new THREE.Color(0xF59E0B), new THREE.Color(0xF97316), new THREE.Color(0xDC2626), new THREE.Color(0x7F1D1D), new THREE.Color(0xFBBF24)],
            [new THREE.Color(0xEC4899), new THREE.Color(0x8B5CF6), new THREE.Color(0x6366F1), new THREE.Color(0x3B82F6), new THREE.Color(0xA855F7)],
            [new THREE.Color(0x10B981), new THREE.Color(0xA3E635), new THREE.Color(0xFACC15), new THREE.Color(0xFB923C), new THREE.Color(0x4ADE80)]
        ];

        const scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0x000000, 0.0015);

        const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1200);
        camera.position.set(0, 5, 22);

        const canvasElement = document.getElementById('neural-network-canvas');
        const renderer = new THREE.WebGLRenderer({ canvas: canvasElement, antialias: true, powerPreference: "high-performance" });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setClearColor(0x000000);
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        
        function createStarfield() {
            const count = 500, pos = [];
            for (let i = 0; i < count; i++) {
                const r = THREE.MathUtils.randFloat(40, 120);
                const phi = Math.acos(THREE.MathUtils.randFloatSpread(2));
                const theta = THREE.MathUtils.randFloat(0, Math.PI * 2);
                pos.push(
                    r * Math.sin(phi) * Math.cos(theta),
                    r * Math.sin(phi) * Math.sin(theta),
                    r * Math.cos(phi)
                );
            }
            const geo = new THREE.BufferGeometry();
            geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
            const mat = new THREE.PointsMaterial({
                color: 0xffffff,
                size: 0.15,
                sizeAttenuation: true,
                depthWrite: false,
                opacity: 0.8,
                transparent: true
            });
            return new THREE.Points(geo, mat);
        }
        const starField = createStarfield();
        scene.add(starField);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.rotateSpeed = 0.5;
        controls.minDistance = 5;
        controls.maxDistance = 100;
        controls.autoRotate = true;
        controls.autoRotateSpeed = 1.0;
        controls.enablePan = false;

        const composer = new EffectComposer(renderer);
        composer.addPass(new RenderPass(scene, camera));

        const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.68);
        composer.addPass(bloomPass);

        const filmPass = new FilmPass(0.35, 0.55, 2048, false);
        composer.addPass(filmPass);

        composer.addPass(new OutputPass());

        const pulseUniforms = {
            uTime: { value: 0.0 },
            uPulsePositions: { value: [new THREE.Vector3(1e3, 1e3, 1e3), new THREE.Vector3(1e3, 1e3, 1e3), new THREE.Vector3(1e3, 1e3, 1e3)] },
            uPulseTimes: { value: [-1e3, -1e3, -1e3] },
            uPulseColors: { value: [new THREE.Color(1, 1, 1), new THREE.Color(1, 1, 1), new THREE.Color(1, 1, 1)] },
            uPulseSpeed: { value: 15.0 },
            uBaseNodeSize: { value: 0.5 },
            uActivePalette: { value: 0 }
        };

        const noiseFunctions = `
        vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
        vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
        vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
        vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
        float snoise(vec3 v){
            const vec2 C=vec2(1.0/6.0,1.0/3.0);const vec4 D=vec4(0.0,0.5,1.0,2.0);
            vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.0-g;vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);
            vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;i=mod289(i);
            vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
            float n_=0.142857142857;vec3 ns=n_*D.wyz-D.xzx;
            vec4 j=p-49.0*floor(p*ns.z*ns.z);vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.0*x_);
            vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.0-abs(x)-abs(y);
            vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);vec4 s0=floor(b0)*2.0+1.0;vec4 s1=floor(b1)*2.0+1.0;
            vec4 sh=-step(h,vec4(0.0));vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
            vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
            vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
            p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);
            m*=m;return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
        }
        float fbm(vec3 p,float time){
            float value=0.0;float amplitude=0.5;float frequency=1.0;int octaves=3;
            for(int i=0;i<octaves;i++){
                value+=amplitude*snoise(p*frequency+time*0.2*frequency);
                amplitude*=0.5;frequency*=2.0;
            }
            return value;
        }`;

        const nodeShader = {
            vertexShader: `${noiseFunctions}
            attribute float nodeSize;attribute float nodeType;attribute vec3 nodeColor;attribute vec3 connectionIndices;attribute float distanceFromRoot;
            uniform float uTime;uniform vec3 uPulsePositions[3];uniform float uPulseTimes[3];uniform float uPulseSpeed;uniform float uBaseNodeSize;
            varying vec3 vColor;varying float vNodeType;varying vec3 vPosition;varying float vPulseIntensity;varying float vDistanceFromRoot;

            float getPulseIntensity(vec3 worldPos, vec3 pulsePos, float pulseTime) {
                if (pulseTime < 0.0) return 0.0;
                float timeSinceClick = uTime - pulseTime;
                if (timeSinceClick < 0.0 || timeSinceClick > 3.0) return 0.0;

                float pulseRadius = timeSinceClick * uPulseSpeed;
                float distToClick = distance(worldPos, pulsePos);
                float pulseThickness = 2.0;
                float waveProximity = abs(distToClick - pulseRadius);

                return smoothstep(pulseThickness, 0.0, waveProximity) * smoothstep(3.0, 0.0, timeSinceClick);
            }

            void main() {
                vNodeType = nodeType;
                vColor = nodeColor;
                vDistanceFromRoot = distanceFromRoot;

                vec3 worldPos = (modelMatrix * vec4(position, 1.0)).xyz;
                vPosition = worldPos;

                float totalPulseIntensity = 0.0;
                for (int i = 0; i < 3; i++) {
                    totalPulseIntensity += getPulseIntensity(worldPos, uPulsePositions[i], uPulseTimes[i]);
                }
                vPulseIntensity = min(totalPulseIntensity, 1.0);

                float timeScale = 0.5 + 0.5 * sin(uTime * 0.8 + distanceFromRoot * 0.2);
                float baseSize = nodeSize * (0.8 + 0.2 * timeScale);
                float pulseSize = baseSize * (1.0 + vPulseIntensity * 2.0);

                vec3 modifiedPosition = position;
                if (nodeType > 0.5) {
                    float noise = fbm(position * 0.1, uTime * 0.1);
                    modifiedPosition += normal * noise * 0.2;
                }

                vec4 mvPosition = modelViewMatrix * vec4(modifiedPosition, 1.0);
                gl_PointSize = pulseSize * uBaseNodeSize * (800.0 / -mvPosition.z);
                gl_Position = projectionMatrix * mvPosition;
            }`,

            fragmentShader: `
            uniform float uTime;uniform vec3 uPulseColors[3];uniform int uActivePalette;
            varying vec3 vColor;varying float vNodeType;varying vec3 vPosition;varying float vPulseIntensity;varying float vDistanceFromRoot;

            void main() {
                vec2 center = 2.0 * gl_PointCoord - 1.0;
                float dist = length(center);
                if (dist > 1.0) discard;

                float glowStrength = 1.0 - smoothstep(0.0, 1.0, dist);
                glowStrength = pow(glowStrength, 2.0);

                vec3 finalColor = vColor;
                if (vPulseIntensity > 0.0) {
                    finalColor = mix(finalColor, vec3(1.0), vPulseIntensity * 0.5);
                }

                float alpha = glowStrength * (0.6 + 0.4 * sin(uTime * 2.0 + vDistanceFromRoot * 0.5));
                gl_FragColor = vec4(finalColor, alpha);
            }`
        };

        const connectionShader = {
            vertexShader: `
            attribute vec3 startPosition;attribute vec3 endPosition;attribute float connectionStrength;attribute float connectionType;
            uniform float uTime;uniform vec3 uPulsePositions[3];uniform float uPulseTimes[3];uniform float uPulseSpeed;
            varying float vStrength;varying float vPulseIntensity;varying vec3 vColor;

            float getPulseIntensity(vec3 worldPos, vec3 pulsePos, float pulseTime) {
                if (pulseTime < 0.0) return 0.0;
                float timeSinceClick = uTime - pulseTime;
                if (timeSinceClick < 0.0 || timeSinceClick > 3.0) return 0.0;

                float pulseRadius = timeSinceClick * uPulseSpeed;
                float distToClick = distance(worldPos, pulsePos);
                float pulseThickness = 2.0;
                float waveProximity = abs(distToClick - pulseRadius);

                return smoothstep(pulseThickness, 0.0, waveProximity) * smoothstep(3.0, 0.0, timeSinceClick);
            }

            void main() {
                vec3 worldPos = mix(startPosition, endPosition, 0.5);
                vStrength = connectionStrength;

                float totalPulseIntensity = 0.0;
                for (int i = 0; i < 3; i++) {
                    totalPulseIntensity += getPulseIntensity(worldPos, uPulsePositions[i], uPulseTimes[i]);
                }
                vPulseIntensity = min(totalPulseIntensity, 1.0);

                vColor = vec3(0.5, 0.7, 1.0);
                if (vPulseIntensity > 0.0) {
                    vColor = mix(vColor, vec3(1.0), vPulseIntensity * 0.5);
                }

                gl_Position = projectionMatrix * modelViewMatrix * vec4(mix(startPosition, endPosition, position.x), 1.0);
            }`,

            fragmentShader: `
            varying float vStrength;varying float vPulseIntensity;varying vec3 vColor;

            void main() {
                float alpha = vStrength * (0.3 + 0.7 * vPulseIntensity);
                gl_FragColor = vec4(vColor, alpha);
            }`
        };

        class NeuralNetwork {
            constructor() {
                this.nodes = [];
                this.connections = [];
                this.nodeGeometry = new THREE.BufferGeometry();
                this.connectionGeometry = new THREE.BufferGeometry();
                this.nodeMaterial = new THREE.ShaderMaterial({
                    uniforms: pulseUniforms,
                    vertexShader: nodeShader.vertexShader,
                    fragmentShader: nodeShader.fragmentShader,
                    transparent: true,
                    depthWrite: false,
                    blending: THREE.AdditiveBlending
                });
                this.connectionMaterial = new THREE.ShaderMaterial({
                    uniforms: pulseUniforms,
                    vertexShader: connectionShader.vertexShader,
                    fragmentShader: connectionShader.fragmentShader,
                    transparent: true,
                    depthWrite: false,
                    blending: THREE.AdditiveBlending
                });
                this.nodeMesh = new THREE.Points(this.nodeGeometry, this.nodeMaterial);
                this.connectionMesh = new THREE.LineSegments(this.connectionGeometry, this.connectionMaterial);
                scene.add(this.nodeMesh);
                scene.add(this.connectionMesh);
                this.generateNetwork();
            }

            generateNetwork() {
                const numLayers = 5;
                const nodesPerLayer = [8, 16, 24, 16, 8];
                const layerSpacing = 6;
                const nodeSpacing = 2;

                this.nodes = [];
                let nodeIndex = 0;

                for (let layer = 0; layer < numLayers; layer++) {
                    const numNodes = Math.floor(nodesPerLayer[layer] * config.densityFactor);
                    const layerRadius = (numNodes * nodeSpacing) / (2 * Math.PI);
                    const layerZ = (layer - (numLayers - 1) / 2) * layerSpacing;

                    for (let i = 0; i < numNodes; i++) {
                        const angle = (numNodes > 0) ? (i / numNodes) * Math.PI * 2 : 0;
                        const x = Math.cos(angle) * layerRadius;
                        const y = Math.sin(angle) * layerRadius;
                        const z = layerZ + (Math.random() - 0.5) * 2;

                        const nodeType = layer === 0 ? 0 : 1;
                        const nodeColor = colorPalettes[config.activePaletteIndex][Math.floor(Math.random() * colorPalettes[config.activePaletteIndex].length)];
                        const distanceFromRoot = Math.sqrt(x * x + y * y + z * z);

                        this.nodes.push({
                            position: new THREE.Vector3(x, y, z),
                            size: 0.5 + Math.random() * 0.5,
                            type: nodeType,
                            color: nodeColor,
                            index: nodeIndex++,
                            distanceFromRoot: distanceFromRoot,
                            connections: []
                        });
                    }
                }

                this.connections = [];
                let currentNodeIndex = 0;
                for (let layer = 0; layer < numLayers - 1; layer++) {
                    const nodesInCurrentLayer = Math.floor(nodesPerLayer[layer] * config.densityFactor);
                    const nodesInNextLayer = Math.floor(nodesPerLayer[layer + 1] * config.densityFactor);
                    const nextLayerStartIndex = currentNodeIndex + nodesInCurrentLayer;

                    for (let i = 0; i < nodesInCurrentLayer; i++) {
                        const startNodeIndex = currentNodeIndex + i;
                        const startNode = this.nodes[startNodeIndex];
                        if (!startNode) continue;
                        
                        for (let j = 0; j < nodesInNextLayer; j++) {
                            const endNodeIndex = nextLayerStartIndex + j;
                            if (endNodeIndex >= this.nodes.length) continue;
                            
                            if (Math.random() < 0.3) {
                                this.connections.push({
                                    start: startNodeIndex,
                                    end: endNodeIndex,
                                    strength: 0.3 + Math.random() * 0.7,
                                    type: 0
                                });
                                startNode.connections.push(endNodeIndex);
                            }
                        }
                    }
                    currentNodeIndex += nodesInCurrentLayer;
                }

                this.updateGeometry();
            }

            updateGeometry() {
                const nodePositions = [];
                const nodeSizes = [];
                const nodeTypes = [];
                const nodeColors = [];
                const connectionIndices = [];
                const distancesFromRoot = [];

                for (const node of this.nodes) {
                    nodePositions.push(node.position.x, node.position.y, node.position.z);
                    nodeSizes.push(node.size);
                    nodeTypes.push(node.type);
                    nodeColors.push(node.color.r, node.color.g, node.color.b);
                    connectionIndices.push(node.connections.length > 0 ? node.connections[0] : -1, node.connections.length > 1 ? node.connections[1] : -1, node.connections.length > 2 ? node.connections[2] : -1);
                    distancesFromRoot.push(node.distanceFromRoot);
                }

                this.nodeGeometry.setAttribute('position', new THREE.Float32BufferAttribute(nodePositions, 3));
                this.nodeGeometry.setAttribute('nodeSize', new THREE.Float32BufferAttribute(nodeSizes, 1));
                this.nodeGeometry.setAttribute('nodeType', new THREE.Float32BufferAttribute(nodeTypes, 1));
                this.nodeGeometry.setAttribute('nodeColor', new THREE.Float32BufferAttribute(nodeColors, 3));
                this.nodeGeometry.setAttribute('connectionIndices', new THREE.Float32BufferAttribute(connectionIndices, 3));
                this.nodeGeometry.setAttribute('distanceFromRoot', new THREE.Float32BufferAttribute(distancesFromRoot, 1));

                const connectionPositions = [];
                const connectionStrengths = [];
                const connectionTypes = [];
                const startPositions = [];
                const endPositions = [];

                for (const conn of this.connections) {
                    const startNode = this.nodes[conn.start];
                    const endNode = this.nodes[conn.end];
                    if (!startNode || !endNode) continue; // Safety check

                    startPositions.push(startNode.position.x, startNode.position.y, startNode.position.z);
                    endPositions.push(endNode.position.x, endNode.position.y, endNode.position.z);
                    connectionPositions.push(0, 0, 0, 1, 0, 0); // Use 3D vectors for position
                    connectionStrengths.push(conn.strength);
                    connectionTypes.push(conn.type);
                }

                this.connectionGeometry.setAttribute('position', new THREE.Float32BufferAttribute(connectionPositions, 3));
                this.connectionGeometry.setAttribute('startPosition', new THREE.Float32BufferAttribute(startPositions, 3));
                this.connectionGeometry.setAttribute('endPosition', new THREE.Float32BufferAttribute(endPositions, 3));
                this.connectionGeometry.setAttribute('connectionStrength', new THREE.Float32BufferAttribute(connectionStrengths, 1));
                this.connectionGeometry.setAttribute('connectionType', new THREE.Float32BufferAttribute(connectionTypes, 1));
            }

            updateFormation() {
                const formations = [
                    () => {}, // Default
                    () => {
                        for (const node of this.nodes) {
                            const angle = Math.atan2(node.position.y, node.position.x);
                            const radius = Math.sqrt(node.position.x * node.position.x + node.position.y * node.position.y);
                            node.position.x = Math.cos(angle + pulseUniforms.uTime.value * 0.1) * radius;
                            node.position.y = Math.sin(angle + pulseUniforms.uTime.value * 0.1) * radius;
                        }
                    },
                    () => {
                        for (const node of this.nodes) {
                            node.position.z += Math.sin(pulseUniforms.uTime.value * 0.5 + node.distanceFromRoot * 0.1) * 0.01;
                        }
                    },
                    () => {
                        for (const node of this.nodes) {
                            const noise = Math.sin(pulseUniforms.uTime.value * 0.3 + node.distanceFromRoot * 0.05) * 0.5;
                            node.position.x += noise * 0.01;
                            node.position.y += noise * 0.01;
                        }
                    }
                ];

                formations[config.currentFormation]();
                this.updateGeometry();
            }
        }

        const neuralNetwork = new NeuralNetwork();

        function triggerPulse(event) {
            const mouse = new THREE.Vector2();
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

            const raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObjects([neuralNetwork.nodeMesh]);

            if (intersects.length > 0) {
                const intersectPoint = intersects[0].point;
                for (let i = 0; i < 3; i++) {
                    if (pulseUniforms.uPulseTimes.value[i] < 0) {
                        pulseUniforms.uPulsePositions.value[i].copy(intersectPoint);
                        pulseUniforms.uPulseTimes.value[i] = pulseUniforms.uTime.value;
                        pulseUniforms.uPulseColors.value[i] = colorPalettes[config.activePaletteIndex][Math.floor(Math.random() * colorPalettes[config.activePaletteIndex].length)];
                        break;
                    }
                }
            }
        }

        canvasElement.addEventListener('click', triggerPulse);

        function animate() {
            requestAnimationFrame(animate);

            if (!config.paused) {
                pulseUniforms.uTime.value += 0.016;
                neuralNetwork.updateFormation();
            }

            controls.update();
            composer.render();
        }

        animate();

        function onWindowResize() {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
            composer.setSize(window.innerWidth, window.innerHeight);
        }

        window.addEventListener('resize', onWindowResize);
