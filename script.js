// Game variables
let scene, camera, renderer;
let player, enemies = [], bullets = [], enemyBullets = [];
let health = 100, score = 0, currentWave = 1, ammo = 30, maxAmmo = 30;
let gameRunning = false;
let keys = {};
let mouseX = 0, mouseY = 0;
let autoFire = false;
let lastFireTime = 0;
let comboMultiplier = 1;
let lastKillTime = 0;
let particles = [];
let powerUps = [];
let turrets = [];
let turretActive = false;
let isFlying = false;
let mouseCenterX = 0;
let mouseCenterY = 0;
let specialAbilityActive = false;
let hasShield = false;
let shieldMesh = null;
let isInvisible = false;
let totalEnemiesKilled = 0;
let waveBonusScore = 0;
let clock = new THREE.Clock();
let animationId = null;
let cameraAngle = 0; // Camera rotation angle
let cameraDistance = 15; // Distance from player
let cameraHeight = 10; // Height above player
let selectedCharacter = null;
let turretMesh = null; // Turret visual
let cameraLocked = false; // Camera lock state
let crosshair = null; // Crosshair mesh
let isMouseDown = false; // Mouse button state
let environment = []; // Environment objects like trees
let raycaster = new THREE.Raycaster(); // For crosshair targeting
let mouseVector = new THREE.Vector2(); // For mouse position
let freeCameraMode = false; // Toggle for free camera mode
let cameraPitch = 0; // Vertical camera angle (up/down)
let cameraYaw = 0; // Horizontal camera angle (left/right)
let thirdPersonMode = true; // Always use third-person camera like Minecraft/Fortnite
let lastPowerUpSpawn = 0; // Last time power-up was spawned
let waveSpawnDelay = 0;
let waveAnnouncementTime = 0;
let cheatPPressed = false;
let cheatMPressed = false;
let cheatPMTriggered = false;
let enemySpawnPositions = [
    { x: -40, z: -40 }, { x: 0, z: -45 }, { x: 40, z: -40 },
    { x: -45, z: 0 }, { x: 45, z: 0 },
    { x: -40, z: 40 }, { x: 0, z: 45 }, { x: 40, z: 40 }
];
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let specialAbilityCooldown = false;
let specialAbilityCooldownTime = 0;

const characterStats = {
    soldier: { health: 100, speed: 4, damage: 20, color: 0x4CAF50, specialAbility: 'none' },
    ninja: { health: 80, speed: 6, damage: 15, color: 0x2196F3, specialAbility: 'stealth' },
    robot: { health: 150, speed: 3, damage: 25, color: 0x9E9E9E, specialAbility: 'turret' },
    dragon: { health: 200, speed: 5, damage: 30, color: 0xffeb3b, specialAbility: 'flight' },
    secret: { health: 999999, speed: 10, damage: 999, color: 0xffffff, specialAbility: 'divine' }
};

// Enemy types for wave system
const enemyTypes = {
    basic: { health: 60, speed: 0.05, damage: 15, color: 0xf44336, size: 0.8, score: 100 },
    fast: { health: 40, speed: 0.08, damage: 10, color: 0xff9800, size: 0.6, score: 150 },
    tank: { health: 100, speed: 0.03, damage: 20, color: 0x795548, size: 1.2, score: 200 },
    sniper: { health: 50, speed: 0.04, damage: 25, color: 0x9c27b0, size: 0.7, score: 175 }
};

function init() {
    // Load selected character
    loadSelectedCharacter();
    
    // Initialize scene
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x87CEEB, 10, 100);
    console.log('Scene created');
    
    // Camera setup
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 10);
    console.log('Camera created');
    
    // Renderer setup
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setClearColor(0x87CEEB); // Sky blue background
    renderer.gammaFactor = 2.2; // Better color perception
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.5;
    document.body.appendChild(renderer.domElement);
    console.log('WebGL renderer created');
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.left = -50;
    directionalLight.shadow.camera.right = 50;
    directionalLight.shadow.camera.top = 50;
    directionalLight.shadow.camera.bottom = -50;
    scene.add(directionalLight);
    
    // Ground
    const groundGeometry = new THREE.PlaneGeometry(100, 100);
    const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x2c3e50 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);
    
    // Grid helper
    const gridHelper = new THREE.GridHelper(100, 20, 0x444444, 0x222222);
    scene.add(gridHelper);
    
    // Create environment
    createEnvironment();
    
    // Create crosshair
    createCrosshair();
    
    // Player with character stats
    createPlayer();
    
    // Create enemies
    createEnemies();
    
    // Event listeners
    window.addEventListener('resize', onWindowResize);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mouseup', onMouseUp);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('click', onMouseClick);
    
    // Pointer lock events
    document.addEventListener('pointerlockchange', onPointerLockChange);
    document.addEventListener('mozpointerlockchange', onPointerLockChange);
    document.addEventListener('webkitpointerlockchange', onPointerLockChange);
    
    console.log('Event listeners added');
    
    console.log('=== INITIALIZATION COMPLETE ===');
    console.log('Total scene objects:', scene.children.length);
    
    // Game will start when startGame() is called
}

function loadSelectedCharacter() {
    const savedCharacter = localStorage.getItem('selectedCharacter');
    if (savedCharacter) {
        selectedCharacter = JSON.parse(savedCharacter);
        health = selectedCharacter.health;
        
        // Update menu with character info
        const characterInfo = document.getElementById('characterInfo');
        if (characterInfo) {
            characterInfo.textContent = `Custom Character - Health: ${health}, Speed: ${selectedCharacter.speed}, Damage: ${selectedCharacter.damage}`;
        }
    } else {
        // Default character if none selected
        selectedCharacter = {
            health: 100,
            speed: 4,
            damage: 20,
            color: 0x4CAF50,
            specialAbility: 'none'
        };
        const characterInfo = document.getElementById('characterInfo');
        if (characterInfo) {
            characterInfo.textContent = 'Default Character';
        }
    }
}

function createEnvironment() {
    console.log('Creating environment...');
    console.log('Current scene objects count:', scene.children.length);
    
    // Create grass ground texture
    const grassGeometry = new THREE.PlaneGeometry(100, 100);
    const grassMaterial = new THREE.MeshLambertMaterial({ color: 0x3a5f3b });
    const grass = new THREE.Mesh(grassGeometry, grassMaterial);
    grass.rotation.x = -Math.PI / 2;
    grass.receiveShadow = true;
    scene.add(grass);
    console.log('Grass added to scene');
    console.log('Scene objects after grass:', scene.children.length);
    
    // Create map boundary walls
    createBoundaryWalls();
    console.log('Boundary walls created');
    console.log('Scene objects after walls:', scene.children.length);
    
    // Create trees
    createTrees();
    console.log('Environment creation complete. Total objects:', scene.children.length);
}

function createBoundaryWalls() {
    const wallHeight = 10;
    const wallThickness = 1;
    const wallColor = 0x8B4513; // Castle wall color
    
    // Create wall material
    const wallMaterial = new THREE.MeshLambertMaterial({ color: wallColor });
    
    // North wall
    const northWallGeometry = new THREE.BoxGeometry(100, wallHeight, wallThickness);
    const northWall = new THREE.Mesh(northWallGeometry, wallMaterial);
    northWall.position.set(0, wallHeight / 2, -50);
    northWall.castShadow = true;
    northWall.receiveShadow = true;
    scene.add(northWall);
    
    // South wall
    const southWallGeometry = new THREE.BoxGeometry(100, wallHeight, wallThickness);
    const southWall = new THREE.Mesh(southWallGeometry, wallMaterial);
    southWall.position.set(0, wallHeight / 2, 50);
    southWall.castShadow = true;
    southWall.receiveShadow = true;
    scene.add(southWall);
    
    // East wall
    const eastWallGeometry = new THREE.BoxGeometry(wallThickness, wallHeight, 100);
    const eastWall = new THREE.Mesh(eastWallGeometry, wallMaterial);
    eastWall.position.set(50, wallHeight / 2, 0);
    eastWall.castShadow = true;
    eastWall.receiveShadow = true;
    scene.add(eastWall);
    
    // West wall
    const westWallGeometry = new THREE.BoxGeometry(wallThickness, wallHeight, 100);
    const westWall = new THREE.Mesh(westWallGeometry, wallMaterial);
    westWall.position.set(-50, wallHeight / 2, 0);
    westWall.castShadow = true;
    westWall.receiveShadow = true;
    scene.add(westWall);
    
    // Add walls to environment array for collision detection
    environment.push(northWall, southWall, eastWall, westWall);
}

function createTrees() {
    console.log('Creating trees...');
    const treePositions = [
        { x: -30, z: -30 }, { x: 20, z: -20 }, { x: -15, z: 25 },
        { x: 35, z: 10 }, { x: -25, z: -10 }, { x: 30, z: 30 },
        { x: 10, z: -35 }, { x: -35, z: 15 }, { x: 40, z: -5 }
    ];
    
    treePositions.forEach((pos, index) => {
        const tree = createTree(pos.x, pos.z);
        if (tree) {
            environment.push(tree);
            console.log(`Tree ${index} created and added to scene`);
        } else {
            console.error(`Failed to create tree ${index}`);
        }
    });
    
    console.log(`Total trees created: ${environment.filter(obj => obj.children && obj.children[0] && obj.children[0].geometry instanceof THREE.CylinderGeometry).length}`);
}

function createTree(x, z) {
    console.log(`Creating tree at position: x=${x}, z=${z}`);
    
    const treeGroup = new THREE.Group();
    
    // Tree trunk - make it larger and more visible
    const trunkGeometry = new THREE.CylinderGeometry(1, 1, 6); // Increased size
    const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = 3; // Raised height
    trunk.castShadow = true;
    treeGroup.add(trunk);
    console.log('Tree trunk created');
    
    // Tree leaves - make them larger and more visible
    const leavesGeometry = new THREE.ConeGeometry(4, 8, 8); // Increased size
    const leavesMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
    const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
    leaves.position.y = 6; // Raised height
    leaves.castShadow = true;
    treeGroup.add(leaves);
    console.log('Tree leaves created');
    
    // Position tree
    treeGroup.position.set(x, 0, z);
    console.log(`Tree positioned at: x=${x}, z=${z}`);
    
    scene.add(treeGroup);
    console.log('Tree added to scene. Total objects now:', scene.children.length);
    
    // Make tree visible in game
    treeGroup.visible = true;
    
    return treeGroup;
}

function createCrosshair() {
    // Create crosshair using HTML overlay for screen-center positioning
    const crosshairElement = document.createElement('div');
    crosshairElement.id = 'crosshair';
    crosshairElement.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 20px;
        height: 20px;
        pointer-events: none;
        z-index: 1000;
    `;
    
    // Create crosshair SVG
    crosshairElement.innerHTML = `
        <svg width="20" height="20" style="position: absolute; top: -10px; left: -10px;">
            <line x1="10" y1="0" x2="10" y2="20" stroke="#00FF00" stroke-width="1"/>
            <line x1="0" y1="10" x2="20" y2="10" stroke="#00FF00" stroke-width="1"/>
            <circle cx="10" cy="10" r="1" fill="#FFFFFF"/>
        </svg>
    `;
    
    document.body.appendChild(crosshairElement);
    crosshair = crosshairElement;
}

function createPlayer() {
    // Check if player already exists
    if (player && scene) {
        console.log('Player already exists, removing old player');
        scene.remove(player);
    }
    
    // Get character type using same reliable detection as toggleSpecialAbility
    let characterType = 'default';
    
    // More reliable character detection using multiple properties
    for (const [key, value] of Object.entries(characterStats)) {
        if (value.health === selectedCharacter.health && 
            value.speed === selectedCharacter.speed && 
            value.damage === selectedCharacter.damage) {
            characterType = key;
            break;
        }
    }
    
    // Map character type to ability
    const abilityMap = {
        'warrior': 'shield',
        'ninja': 'invisibility', 
        'mage': 'fireball',
        'robot': 'turret',
        'alien': 'teleport',
        'dragon': 'flight',
        'secret': 'divine',
        'god': 'divine'
    };
    
    // Map character types to characterStats
    const characterMap = {
        'warrior': characterStats.soldier,
        'ninja': characterStats.ninja,
        'mage': characterStats.soldier, // Use soldier stats for mage
        'robot': characterStats.robot,
        'alien': characterStats.soldier, // Use soldier stats for alien
        'dragon': characterStats.dragon,
        'secret': characterStats.secret,
        'god': characterStats.god
    };
    
    selectedCharacter = characterMap[characterType] || characterStats.soldier;
    health = selectedCharacter.health;
    
    console.log('Creating character type:', characterType, 'Selected character:', selectedCharacter);
    console.log('Character stats:');
    console.log('- Health:', selectedCharacter.health);
    console.log('- Speed:', selectedCharacter.speed);
    console.log('- Damage:', selectedCharacter.damage);
    console.log('- Color:', selectedCharacter.color);
    console.log('- Ability:', selectedCharacter.specialAbility);
    
    let playerGeometry;
    let playerMaterial;
    let playerGroup = new THREE.Group();
    
    switch(characterType) {
        case 'warrior':
            console.log('Creating Warrior model...');
            // Warrior - Humanoid with armor
            playerGeometry = new THREE.BoxGeometry(0.8, 1.5, 0.4);
            playerMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
            const warriorBody = new THREE.Mesh(playerGeometry, playerMaterial);
            warriorBody.position.y = 0.6;
            playerGroup.add(warriorBody);
            
            // Head
            const headGeometry = new THREE.SphereGeometry(0.3, 8, 8);
            const headMaterial = new THREE.MeshLambertMaterial({ color: 0xFDBCB4 });
            const head = new THREE.Mesh(headGeometry, headMaterial);
            head.position.y = 1.4;
            playerGroup.add(head);
            
            // Sword
            const swordGeometry = new THREE.BoxGeometry(0.1, 1.5, 0.05);
            const swordMaterial = new THREE.MeshLambertMaterial({ color: 0xC0C0C0 });
            const sword = new THREE.Mesh(swordGeometry, swordMaterial);
            sword.position.set(0.6, 1.2, 0);
            playerGroup.add(sword);
            
            // Shield
            const shieldGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.05, 8);
            const shieldMaterial = new THREE.MeshLambertMaterial({ color: 0x4169E1 });
            const shield = new THREE.Mesh(shieldGeometry, shieldMaterial);
            shield.position.set(-0.5, 0.8, 0);
            shield.rotation.z = Math.PI / 2;
            playerGroup.add(shield);
            console.log('Warrior model created');
            break;
            
        case 'ninja':
            console.log('Creating Ninja model...');
            // Ninja - Sleek assassin
            playerGeometry = new THREE.BoxGeometry(0.4, 1.2, 0.3);
            playerMaterial = new THREE.MeshLambertMaterial({ color: 0x2F4F4F });
            const ninjaBody = new THREE.Mesh(playerGeometry, playerMaterial);
            ninjaBody.position.y = 0.6;
            playerGroup.add(ninjaBody);
            
            // Head (wrapped)
            const ninjaHeadGeometry = new THREE.BoxGeometry(0.25, 0.3, 0.25);
            const ninjaHeadMaterial = new THREE.MeshLambertMaterial({ color: 0x1C1C1C });
            const ninjaHead = new THREE.Mesh(ninjaHeadGeometry, ninjaHeadMaterial);
            ninjaHead.position.y = 1.3;
            playerGroup.add(ninjaHead);
            
            // Katana
            const katanaGeometry = new THREE.BoxGeometry(0.05, 1.8, 0.02);
            const katanaMaterial = new THREE.MeshLambertMaterial({ color: 0xC0C0C0 });
            const katana = new THREE.Mesh(katanaGeometry, katanaMaterial);
            katana.position.set(0.4, 1.5, 0);
            playerGroup.add(katana);
            console.log('Ninja model created');
            break;
            
        case 'mage':
            console.log('Creating Mage model...');
            // Mage - Robe and staff
            playerGeometry = new THREE.BoxGeometry(0.6, 1.2, 0.3);
            playerMaterial = new THREE.MeshLambertMaterial({ color: 0x4B0082 });
            const mageBody = new THREE.Mesh(playerGeometry, playerMaterial);
            mageBody.position.y = 0.6;
            playerGroup.add(mageBody);
            
            // Wizard hat
            const hatGeometry = new THREE.ConeGeometry(0.4, 0.6, 8);
            const hatMaterial = new THREE.MeshLambertMaterial({ color: 0x2E0854 });
            const hat = new THREE.Mesh(hatGeometry, hatMaterial);
            hat.position.y = 1.8;
            playerGroup.add(hat);
            
            // Staff
            const staffGeometry = new THREE.CylinderGeometry(0.03, 0.03, 2.5, 8);
            const staffMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
            const staff = new THREE.Mesh(staffGeometry, staffMaterial);
            staff.position.set(0.3, 1.2, 0);
            playerGroup.add(staff);
            
            // Crystal on staff
            const crystalGeometry = new THREE.OctahedronGeometry(0.15);
            const crystalMaterial = new THREE.MeshLambertMaterial({ 
                color: 0x00FFFF, 
                transparent: true, 
                emissive: true,
                emissiveIntensity: 0.3
            });
            const crystal = new THREE.Mesh(crystalGeometry, crystalMaterial);
            crystal.position.set(0.3, 2.8, 0);
            playerGroup.add(crystal);
            console.log('Mage model created');
            break;
            
        case 'robot':
            console.log('Creating Robot model...');
            // Robot - Mechanical parts
            playerGeometry = new THREE.BoxGeometry(1, 1.5, 0.8);
            playerMaterial = new THREE.MeshLambertMaterial({ color: 0x9E9E9E });
            const robotBody = new THREE.Mesh(playerGeometry, playerMaterial);
            robotBody.position.y = 0.75;
            playerGroup.add(robotBody);
            
            // Head
            const robotHeadGeometry = new THREE.BoxGeometry(0.6, 0.6, 0.6);
            const robotHeadMaterial = new THREE.MeshLambertMaterial({ color: 0x606060 });
            const robotHead = new THREE.Mesh(robotHeadGeometry, robotHeadMaterial);
            robotHead.position.y = 1.6;
            playerGroup.add(robotHead);
            
            // Arms
            const armGeometry = new THREE.BoxGeometry(0.2, 1.5, 0.8);
            const armMaterial = new THREE.MeshLambertMaterial({ color: 0x808080 });
            const leftArm = new THREE.Mesh(armGeometry, armMaterial);
            leftArm.position.set(-0.7, 1.2, 0);
            playerGroup.add(leftArm);
            
            const rightArm = new THREE.Mesh(armGeometry, armMaterial);
            rightArm.position.set(0.7, 1.2, 0);
            playerGroup.add(rightArm);
            
            // Antenna
            const antennaGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.3, 8);
            const antennaMaterial = new THREE.MeshLambertMaterial({ color: 0xFF0000 });
            const antenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
            antenna.position.set(0, 2.2, 0);
            playerGroup.add(antenna);
            console.log('Robot model created');
            break;
            
        case 'alien':
            console.log('Creating Alien model...');
            // Alien - Non-humanoid
            playerGeometry = new THREE.SphereGeometry(0.6, 8, 8);
            playerMaterial = new THREE.MeshLambertMaterial({ color: 0x00FF00 });
            const alienBody = new THREE.Mesh(playerGeometry, playerMaterial);
            alienBody.scale.set(1, 0.8, 1.2);
            alienBody.position.y = 0.8;
            playerGroup.add(alienBody);
            
            // Large eyes
            const eyeGeometry = new THREE.SphereGeometry(0.15, 8, 8);
            const eyeMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });
            
            // Left eye
            const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
            leftEye.position.set(-0.2, 1.2, 0);
            playerGroup.add(leftEye);
            
            // Right eye
            const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
            rightEye.position.set(0.2, 1.2, 0);
            playerGroup.add(rightEye);
            
            // Tentacles
            for (let i = 0; i < 4; i++) {
                const tentacleGeometry = new THREE.CylinderGeometry(0.05, 0.08, 0.3, 8);
                const tentacleMaterial = new THREE.MeshLambertMaterial({ color: 0x00CC00 });
                const tentacle = new THREE.Mesh(tentacleGeometry, tentacleMaterial);
                const angle = (i / 4) * Math.PI * 2;
                tentacle.position.set(
                    Math.cos(angle) * 0.4,
                    0.2,
                    Math.sin(angle) * 0.4
                );
                tentacle.rotation.x = angle;
                tentacle.rotation.z = Math.PI / 2;
                playerGroup.add(tentacle);
            }
            console.log('Alien model created');
            break;
            
        case 'dragon':
            console.log('Creating Dragon model...');
            // Dragon - Reptilian beast
            playerGeometry = new THREE.BoxGeometry(2, 1.5, 0.8);
            playerMaterial = new THREE.MeshLambertMaterial({ color: 0xFFEB3B });
            const dragonBody = new THREE.Mesh(playerGeometry, playerMaterial);
            dragonBody.position.y = 0.8;
            playerGroup.add(dragonBody);
            
            // Dragon head
            const dragonHeadGeometry = new THREE.BoxGeometry(1, 0.8, 1.2);
            const dragonHeadMaterial = new THREE.MeshLambertMaterial({ color: 0xFF6347 });
            const dragonHead = new THREE.Mesh(dragonHeadGeometry, dragonHeadMaterial);
            dragonHead.position.y = 1.8;
            playerGroup.add(dragonHead);
            
            // Wings (folded by default)
            const wingGeometry = new THREE.BoxGeometry(3, 0.1, 1.5);
            const wingMaterial = new THREE.MeshLambertMaterial({ 
                color: 0xFFEB3B, 
                transparent: true, 
                opacity: 0.8 
            });
            const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
            leftWing.position.set(-1.8, 0, 0);
            playerGroup.add(leftWing);
            
            const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
            rightWing.position.set(1.8, 0, 0);
            playerGroup.add(rightWing);
            
            // Tail
            const tailGeometry = new THREE.ConeGeometry(0.3, 2, 8);
            const tailMaterial = new THREE.MeshLambertMaterial({ color: 0xFFEB3B });
            const tail = new THREE.Mesh(tailGeometry, tailMaterial);
            tail.position.set(0, -0.5, 2);
            tail.rotation.x = Math.PI / 2;
            playerGroup.add(tail);
            console.log('Dragon model created');
            break;
            
        case 'secret':
            console.log('Creating SECRET model...');
            // SECRET - Ethereal divine being
            playerGeometry = new THREE.SphereGeometry(1.2, 16, 16);
            playerMaterial = new THREE.MeshLambertMaterial({ 
                color: 0x8A2BE2, 
                transparent: true, 
                opacity: 0.6,
                emissive: true,
                emissiveIntensity: 0.8,
                emissiveColor: 0x8A2BE2
            });
            const secretBody = new THREE.Mesh(playerGeometry, playerMaterial);
            secretBody.position.y = 1;
            playerGroup.add(secretBody);
            
            // Divine aura
            const auraGeometry = new THREE.SphereGeometry(1.5, 16, 16);
            const auraMaterial = new THREE.MeshBasicMaterial({ 
                color: 0xFFD700, 
                transparent: true, 
                opacity: 0.4,
                emissive: true,
                emissiveIntensity: 0.5,
                emissiveColor: 0xFFD700
            });
            const aura = new THREE.Mesh(auraGeometry, auraMaterial);
            aura.position.y = 1;
            playerGroup.add(aura);
            
            // Crown
            const crownGeometry = new THREE.TorusGeometry(0.8, 0.1, 16);
            const crownMaterial = new THREE.MeshBasicMaterial({ 
                color: 0xFFFFFF, 
                transparent: true, 
                opacity: 0.9,
                emissive: true,
                emissiveIntensity: 0.7,
                emissiveColor: 0xFFD700
            });
            const crown = new THREE.Mesh(crownGeometry, crownMaterial);
            crown.position.y = 2.5;
            crown.rotation.x = Math.PI / 2;
            playerGroup.add(crown);
            
            // Floating particles
            for (let i = 0; i < 8; i++) {
                const particleGeometry = new THREE.SphereGeometry(0.05, 8, 8);
                const particleMaterial = new THREE.MeshBasicMaterial({ 
                    color: 0xFFFFFF, 
                    transparent: true, 
                    opacity: 0.8,
                    emissive: true,
                    emissiveIntensity: 0.5,
                    emissiveColor: 0x8A2BE2
                });
                const particle = new THREE.Mesh(particleGeometry, particleMaterial);
                const angle = (i / 8) * Math.PI * 2;
                const radius = 1.2;
                particle.position.set(
                    Math.cos(angle) * radius,
                    2 + Math.sin(Date.now() * 0.001 + i) * 0.3,
                    Math.sin(angle) * radius
                );
                playerGroup.add(particle);
            }
            console.log('SECRET model created');
            break;
            
        case 'god':
            console.log('Creating GOD model...');
            // GOD - Divine being with golden appearance
            playerGeometry = new THREE.SphereGeometry(1.5, 16, 16);
            playerMaterial = new THREE.MeshLambertMaterial({ 
                color: 0xFFD700, 
                transparent: true, 
                opacity: 0.6,
                emissive: true,
                emissiveIntensity: 0.8,
                emissiveColor: 0xFFD700
            });
            const godBody = new THREE.Mesh(playerGeometry, playerMaterial);
            godBody.position.y = 1;
            playerGroup.add(godBody);
            
            // Divine aura
            const godAuraGeometry = new THREE.SphereGeometry(1.5, 16, 16);
            const godAuraMaterial = new THREE.MeshBasicMaterial({ 
                color: 0xFFFFFF, 
                transparent: true, 
                opacity: 0.4,
                emissive: true,
                emissiveIntensity: 0.5,
                emissiveColor: 0xFFD700
            });
            const godAura = new THREE.Mesh(godAuraGeometry, godAuraMaterial);
            godAura.position.y = 1;
            playerGroup.add(godAura);
            
            // Divine crown
            const godCrownGeometry = new THREE.TorusGeometry(1.2, 0.1, 16);
            const godCrownMaterial = new THREE.MeshBasicMaterial({ 
                color: 0xFFFFFF, 
                transparent: true, 
                opacity: 0.9,
                emissive: true,
                emissiveIntensity: 0.7,
                emissiveColor: 0xFFD700
            });
            const godCrown = new THREE.Mesh(godCrownGeometry, godCrownMaterial);
            godCrown.position.y = 2.5;
            godCrown.rotation.x = Math.PI / 2;
            playerGroup.add(godCrown);
            
            // Floating particles
            for (let i = 0; i < 12; i++) {
                const particleGeometry = new THREE.SphereGeometry(0.05, 8, 8);
                const particleMaterial = new THREE.MeshBasicMaterial({ 
                    color: 0xFFFFFF, 
                    transparent: true, 
                    opacity: 0.8,
                    emissive: true,
                    emissiveIntensity: 0.5,
                    emissiveColor: 0xFFD700
                });
                const particle = new THREE.Mesh(particleGeometry, particleMaterial);
                const angle = (i / 12) * Math.PI * 2;
                const radius = 1.5;
                particle.position.set(
                    Math.cos(angle) * radius,
                    2 + Math.sin(Date.now() * 0.001 + i) * 0.3,
                    Math.sin(angle) * radius
                );
                playerGroup.add(particle);
            }
            console.log('GOD model created');
            break;
            
        default:
            console.log('Creating Default model...');
            // Default character - Simple cube
            playerGeometry = new THREE.BoxGeometry(1, 1.5, 0.8);
            playerMaterial = new THREE.MeshLambertMaterial({ color: selectedCharacter.color });
            const defaultBody = new THREE.Mesh(playerGeometry, playerMaterial);
            defaultBody.position.y = 0.6;
            playerGroup.add(defaultBody);
            console.log('Default model created');
            break;
    }
    
    // Always use playerGroup which contains the detailed character model
    player = playerGroup;
    
    player.position.set(0, 1, 10);
    player.castShadow = true;
    
    // Add shadows to all child meshes
    if (player.children) {
        player.children.forEach(child => {
            child.castShadow = true;
        });
    }
    
    scene.add(player);
    console.log('Player added to scene at position:', player.position);
}

function createEnemies() {
    // Create enemies after player is initialized
    if (!player) {
        console.log('Waiting for player to be created before spawning enemies...');
        return;
    }
    // Start with first wave
    startWave(1);
}

function startWave(waveNumber) {
    console.log(`Starting Wave ${waveNumber}`);
    currentWave = waveNumber;
    enemiesKilledThisWave = 0;
    waveInProgress = true;
    waveAnnouncementTime = 180; // 3 seconds at 60fps
    
    // Calculate enemies for this wave
    enemiesPerWave = Math.min(3 + Math.floor(waveNumber / 2), 12); // Max 12 enemies
    
    // Show wave announcement
    showWaveAnnouncement(waveNumber, enemiesPerWave);
    
    // Spawn enemies with delay
    waveSpawnDelay = 60; // 1 second delay before spawning
}

function spawnWaveEnemies() {
    const enemiesToSpawn = enemiesPerWave;
    
    for (let i = 0; i < enemiesToSpawn; i++) {
        setTimeout(() => {
            createWaveEnemy(currentWave);
        }, i * 500); // Spawn each enemy with 500ms delay
    }
}

function createWaveEnemy(waveNumber) {
    // Determine enemy type based on wave
    let enemyType = 'basic';
    const rand = Math.random();
    
    if (waveNumber >= 3 && rand < 0.2) enemyType = 'tank';
    else if (waveNumber >= 2 && rand < 0.3) enemyType = 'fast';
    else if (waveNumber >= 4 && rand < 0.15) enemyType = 'sniper';
    
    const enemyStats = enemyTypes[enemyType];
    
    // Create enemy with appropriate stats
    const enemyGeometry = new THREE.BoxGeometry(enemyStats.size, enemyStats.size * 1.5, enemyStats.size);
    const enemyMaterial = new THREE.MeshLambertMaterial({ color: enemyStats.color });
    const enemy = new THREE.Mesh(enemyGeometry, enemyMaterial);
    
    // Random spawn position from predefined positions
    const spawnPos = enemySpawnPositions[Math.floor(Math.random() * enemySpawnPositions.length)];
    enemy.position.set(spawnPos.x, enemyStats.size * 0.75, spawnPos.z);
    
    enemy.castShadow = true;
    enemy.health = enemyStats.health + (waveNumber - 1) * 10; // Scale health with wave
    enemy.speed = enemyStats.speed + (waveNumber - 1) * 0.005; // Scale speed with wave
    enemy.shootCooldown = 0;
    enemy.damage = enemyStats.damage;
    enemy.enemyType = enemyType;
    enemy.scoreValue = enemyStats.score;
    
    enemies.push(enemy);
    scene.add(enemy);
    
    console.log(`Spawned ${enemyType} enemy for wave ${waveNumber}`);
}

function showWaveAnnouncement(waveNumber, enemyCount) {
    // Create or update wave announcement element
    let announcement = document.getElementById('waveAnnouncement');
    if (!announcement) {
        announcement = document.createElement('div');
        announcement.id = 'waveAnnouncement';
        announcement.style.cssText = `
            position: absolute;
            top: 30%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: white;
            font-size: 3em;
            font-weight: bold;
            text-align: center;
            z-index: 500;
            text-shadow: 3px 3px 6px rgba(0,0,0,0.8);
            animation: wavePulse 2s ease-in-out;
        `;
        document.body.appendChild(announcement);
    }
    
    announcement.innerHTML = `
        <div>WAVE ${waveNumber}</div>
        <div style="font-size: 0.5em; margin-top: 10px;">${enemyCount} ENEMIES APPROACHING</div>
    `;
    announcement.style.display = 'block';
}

function hideWaveAnnouncement() {
    const announcement = document.getElementById('waveAnnouncement');
    if (announcement) {
        announcement.style.display = 'none';
    }
}

function checkWaveCompletion() {
    if (waveInProgress && enemies.length === 0) {
        // Wave completed
        waveInProgress = false;
        const waveBonus = currentWave * 50;
        score += waveBonus;
        totalEnemiesKilled += enemiesKilledThisWave;
        
        console.log(`Wave ${currentWave} completed! Bonus: ${waveBonus}`);
        
        // Show completion message briefly
        showWaveCompleted(currentWave, waveBonus);
        
        // Start next wave after delay
        setTimeout(() => {
            startWave(currentWave + 1);
        }, 3000);
    }
}

function showWaveCompleted(waveNumber) {
    const completion = document.createElement('div');
    completion.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 255, 0, 0.9);
        color: white;
        padding: 30px;
        border-radius: 10px;
        font-size: 2em;
        font-weight: bold;
        z-index: 500;
        text-align: center;
        box-shadow: 0 10px 30px rgba(0, 255, 0, 0.5);
        animation: pulse 0.5s ease-in-out infinite;
    `;
    
    const bonus = waveNumber * 500;
    completion.innerHTML = `
        <div>WAVE ${waveNumber} COMPLETE!</div>
        <div style="font-size: 0.6em; margin-top: 10px;">Bonus: +${bonus}</div>
    `;
    document.body.appendChild(completion);
    
    setTimeout(() => {
        document.body.removeChild(completion);
    }, 2500);
}

function showCodeChamber() {
    document.getElementById('codeChamber').style.display = 'flex';
    document.getElementById('codeInput').value = '';
    document.getElementById('codeMessage').textContent = '';
    document.getElementById('codeMessage').className = 'code-message';
    document.getElementById('codeInput').focus();
}

function resetProgress() {
    // Clear all localStorage data
    localStorage.removeItem('selectedCharacter');
    localStorage.removeItem('godUnlocked');
    localStorage.removeItem('secretUnlocked');
    localStorage.removeItem('infiniteAmmo');
    localStorage.removeItem('usedCodes');
    
    // Reset to default character
    selectedCharacter = characterStats.soldier;
    health = selectedCharacter.health;
    
    // Reset game variables
    score = 0;
    currentWave = 1;
    ammo = 30;
    maxAmmo = 30;
    totalEnemiesKilled = 0;
    
    // Update menu display
    const characterInfo = document.getElementById('characterInfo');
    if (characterInfo) {
        characterInfo.textContent = 'Default Character - Health: 100, Speed: 4, Damage: 20';
    }
    
    console.log('🔄 Progress reset! All data cleared.');
    alert('Progress reset successfully! All codes and unlocks have been cleared.');
}

function hideCodeChamber() {
    document.getElementById('codeChamber').style.display = 'none';
}

function redeemCode() {
    const codeInput = document.getElementById('codeInput');
    const codeMessage = document.getElementById('codeMessage');
    const code = codeInput.value.trim().toUpperCase();
    
    // Clear previous message
    codeMessage.textContent = '';
    codeMessage.className = 'code-message';
    
    if (!code) {
        codeMessage.textContent = 'Please enter a code';
        codeMessage.className = 'code-message error';
        return;
    }
    
    // Check if code has already been used
    const usedCodes = JSON.parse(localStorage.getItem('usedCodes') || '[]');
    if (usedCodes.includes(code)) {
        codeMessage.textContent = 'Code already used';
        codeMessage.className = 'code-message error';
        return;
    }
    
    // Valid codes and their rewards
    const validCodes = {
        'SECRET': { 
            type: 'secret', 
            value: true, 
            message: '🤫 SECRET UNLOCKED! Divine Power Activated!' 
        },
        'GOD': { 
            type: 'god', 
            value: true, 
            message: '⚡ GOD MODE UNLOCKED! Divine Power Activated!' 
        },
        'INFINITY': { 
            type: 'infinite', 
            value: true, 
            message: '♾️ INFINITY UNLOCKED! Unlimited Ammo Forever!' 
        },
        'GODMODE': { type: 'health', value: 500, message: '🛡️ God Mode Activated! +500 Health' },
        'INFINITE': { type: 'ammo', value: 999, message: '🔫 Infinite Ammo! +999 Ammo' },
        'SPEEDDEMON': { type: 'speed', value: 10, message: '⚡ Speed Demon! +10 Speed' },
        'DAMAGEKING': { type: 'damage', value: 100, message: '💪 Damage King! +100 Damage' },
        'RAINBOW': { type: 'rainbow', value: true, message: '🌈 Rainbow Power! Special Effects' },
        'FLAMEMASTER': { type: 'flame', value: true, message: '🔥 Flame Master! Enhanced Fire' },
        'SHIELDMASTER': { type: 'shield', value: true, message: '🛡️ Shield Master! Permanent Shield' },
        'NINJASTEALTH': { type: 'stealth', value: true, message: '🥷 Ninja Stealth! Always Invisible' },
        'DRAGONLORD': { type: 'dragon', value: true, message: '🐉 Dragon Lord! Ultimate Power' },
        'ROCKETMAN': { type: 'rocket', value: true, message: '🚀 Rocket Man! Jetpack Enabled' },
        'MONEYGROWS': { type: 'score', value: 10000, message: '💰 Money Grows! +10000 Score' },
        'WAVEMASTER': { type: 'wave', value: 10, message: '🌊 Wave Master! Skip to Wave 10' }
    };
    
    if (validCodes[code]) {
        const reward = validCodes[code];
        
        // Apply the reward
        applyCodeReward(reward);
        
        // Mark code as used
        usedCodes.push(code);
        localStorage.setItem('usedCodes', JSON.stringify(usedCodes));
        
        // Show success message
        codeMessage.textContent = reward.message;
        codeMessage.className = 'code-message success';
        
        // Clear input after successful redemption
        setTimeout(() => {
            codeInput.value = '';
        }, 2000);
        
        console.log('Code redeemed successfully:', code, reward);
    } else {
        codeMessage.textContent = 'Invalid code';
        codeMessage.className = 'code-message error';
        console.log('Invalid code attempted:', code);
    }
}

function instantKillAllEnemies() {
    if (enemies.length === 0) {
        console.log('⚡ No enemies to kill!');
        return;
    }
    
    if (!player) {
        console.log('⚡ Player not found!');
        return;
    }
    
    console.log(`⚡ Divine strike! Killing ${enemies.length} enemies!`);
    
    // Create divine effect at player position
    createDivineEffect(player.position);
    
    // Kill all enemies with divine explosion
    const enemiesToKill = [...enemies]; // Copy array to avoid modification during iteration
    enemiesToKill.forEach(enemy => {
        if (!enemy) {
            console.log('⚡ Invalid enemy found, skipping');
            return;
        }
        
        // Handle both enemy structures: direct mesh or enemy.mesh
        const enemyMesh = enemy.mesh || enemy;
        if (!enemyMesh || !enemyMesh.position) {
            console.log('⚡ Enemy has no valid mesh, skipping');
            return;
        }
        
        // Create explosion at enemy position
        createExplosionEffect(enemyMesh.position);
        
        // Remove enemy from scene
        scene.remove(enemyMesh);
        
        // Remove from enemies array - find and remove by index
        const index = enemies.indexOf(enemy);
        if (index > -1) {
            enemies.splice(index, 1);
        }
        
        // Update score and stats
        score += enemy.scoreValue || enemy.score || 100;
        totalEnemiesKilled++;
    });
    
    // Create screen flash effect
    createScreenFlash(0xffffff, 0.8);
    
    // Update UI
    updateUI();
    
    console.log(`⚡ Divine strike complete! ${enemiesToKill.length} enemies eliminated! Score: +${enemiesToKill.reduce((sum, e) => sum + (e.scoreValue || e.score || 100), 0)}`);
}

function createDivineEffect(position) {
    // Create multiple divine light beams
    for (let i = 0; i < 12; i++) {
        const beamGeometry = new THREE.CylinderGeometry(0.1, 2, 20, 8);
        const beamMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xffffff, 
            transparent: true, 
            opacity: 0.8 
        });
        const beam = new THREE.Mesh(beamGeometry, beamMaterial);
        
        // Position beams in a circle around the player
        const angle = (i / 12) * Math.PI * 2;
        const radius = 15;
        beam.position.set(
            position.x + Math.cos(angle) * radius,
            position.y + 10,
            position.z + Math.sin(angle) * radius
        );
        beam.rotation.x = Math.PI / 2;
        
        scene.add(beam);
        
        // Animate beam
        let opacity = 0.8;
        const animateBeam = () => {
            opacity -= 0.02;
            beam.material.opacity = opacity;
            
            if (opacity <= 0) {
                scene.remove(beam);
            } else {
                requestAnimationFrame(animateBeam);
            }
        };
        animateBeam();
    }
    
    // Create divine sphere
    const sphereGeometry = new THREE.SphereGeometry(10, 16, 16);
    const sphereMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xffffff, 
        transparent: true, 
        opacity: 0.3 
    });
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    sphere.position.copy(position);
    sphere.position.y += 5;
    scene.add(sphere);
    
    // Animate sphere expansion
    let scale = 1;
    const animateSphere = () => {
        scale += 0.1;
        sphere.scale.set(scale, scale, scale);
        sphere.material.opacity = Math.max(0, 0.3 - scale * 0.02);
        
        if (sphere.material.opacity <= 0) {
            scene.remove(sphere);
        } else {
            requestAnimationFrame(animateSphere);
        }
    };
    animateSphere();
}

function createScreenFlash(color, intensity) {
    // Create screen flash effect
    const flash = document.createElement('div');
    flash.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: ${color};
        opacity: ${intensity};
        z-index: 9999;
        pointer-events: none;
    `;
    document.body.appendChild(flash);
    
    // Fade out flash
    let opacity = intensity;
    const fadeFlash = () => {
        opacity -= 0.05;
        flash.style.opacity = opacity;
        
        if (opacity <= 0) {
            document.body.removeChild(flash);
        } else {
            requestAnimationFrame(fadeFlash);
        }
    };
    fadeFlash();
}

function applyCodeReward(reward) {
    switch(reward.type) {
        case 'secret':
            // Unlock SECRET character - save to localStorage
            localStorage.setItem('secretUnlocked', 'true');
            selectedCharacter = characterStats.secret;
            health = selectedCharacter.health;
            localStorage.setItem('selectedCharacter', JSON.stringify(selectedCharacter));
            console.log('🤫 SECRET character unlocked forever!');
            break;
        case 'god':
            // Unlock GOD character - save to localStorage
            localStorage.setItem('godUnlocked', 'true');
            selectedCharacter = characterStats.god;
            health = selectedCharacter.health;
            localStorage.setItem('selectedCharacter', JSON.stringify(selectedCharacter));
            console.log('⚡ GOD character unlocked forever!');
            break;
        case 'infinite':
            // Infinite ammo forever - save to localStorage
            localStorage.setItem('infiniteAmmo', 'true');
            ammo = 999;
            maxAmmo = 999;
            console.log('♾️ Infinite ammo unlocked forever!');
            break;
        case 'health':
            health = Math.min(health + reward.value, 999);
            break;
        case 'ammo':
            ammo = reward.value;
            maxAmmo = reward.value;
            break;
        case 'speed':
            if (selectedCharacter) {
                selectedCharacter.speed = reward.value;
            }
            break;
        case 'damage':
            if (selectedCharacter) {
                selectedCharacter.damage = reward.value;
            }
            break;
        case 'score':
            score += reward.value;
            break;
        case 'wave':
            currentWave = reward.value - 1; // Will become reward.value after next wave
            break;
        case 'shield':
            hasShield = true;
            break;
        case 'stealth':
            isInvisible = true;
            break;
        case 'flame':
            // Enhanced fire effects (already implemented for dragon)
            break;
        case 'dragon':
            // Unlock dragon character if not already selected
            selectedCharacter = characterStats.dragon;
            health = selectedCharacter.health;
            localStorage.setItem('selectedCharacter', JSON.stringify(selectedCharacter));
            break;
        case 'rocket':
            // Jetpack effect (could be implemented as enhanced flight)
            break;
        case 'rainbow':
            // Rainbow effects (could be implemented as special visual effects)
            break;
    }
    
    // Save character changes
    if (selectedCharacter) {
        localStorage.setItem('selectedCharacter', JSON.stringify(selectedCharacter));
    }
    
    // Update UI if game is running
    if (gameRunning) {
        updateUI();
    }
}

function showMenu() {
    document.getElementById('menu').style.display = 'flex';
    document.getElementById('gameOver').style.display = 'none';
    document.getElementById('victory').style.display = 'none';
    document.getElementById('gameUI').style.display = 'none';
    document.getElementById('characterSelection').style.display = 'none';
    document.getElementById('codeChamber').style.display = 'none';
}

function startGame() {
    document.getElementById('menu').style.display = 'none';
    document.getElementById('gameUI').style.display = 'block';
    gameRunning = true;
    
    // Apply infinite ammo if unlocked
    const hasInfiniteAmmo = localStorage.getItem('infiniteAmmo') === 'true';
    if (hasInfiniteAmmo) {
        ammo = 999;
        maxAmmo = 999;
        console.log('♾️ Infinite ammo applied for this game!');
    }
    
    // Initialize camera angles for third-person view
    cameraYaw = 0;
    cameraPitch = 0;
    console.log('Game started - Camera initialized - Yaw:', cameraYaw, 'Pitch:', cameraPitch);
    
    // Create player if not exists
    if (!player) {
        createPlayer();
    }
    
    // Start first wave
    startWave(1);
    
    mouseCenterX = window.innerWidth / 2;
    mouseCenterY = window.innerHeight / 2;
    mouseX = mouseCenterX;
    mouseY = mouseCenterY;
    
    // Lock mouse pointer
    document.body.requestPointerLock = document.body.requestPointerLock || 
                                          document.body.mozRequestPointerLock || 
                                          document.body.webkitRequestPointerLock;
    
    if (document.body.requestPointerLock) {
        document.body.requestPointerLock();
    }
    
    animate();
}

function animate() {
    if (!gameRunning) return;
    
    try {
        requestAnimationFrame(animate);
        
        const delta = clock.getDelta();
        
        // Check if player exists before using it
        if (!player) {
            console.error('Player not initialized, creating player...');
            createPlayer();
            return;
        }
        
        // Get character type for dragon flight
        const characterType = Object.keys(characterStats).find(key => 
            JSON.stringify(characterStats[key]) === JSON.stringify(selectedCharacter)
        );
        
        // Update player movement based on camera direction
        const moveSpeed = selectedCharacter.speed * 0.05; // Use character speed
        
        if (moveForward) {
            player.position.x += moveSpeed * Math.sin(cameraYaw);
            player.position.z += moveSpeed * Math.cos(cameraYaw);
        }
        if (moveBackward) {
            player.position.x -= moveSpeed * Math.sin(cameraYaw);
            player.position.z -= moveSpeed * Math.cos(cameraYaw);
        }
        if (moveLeft) {
            player.position.x -= moveSpeed * Math.cos(cameraYaw);
            player.position.z += moveSpeed * Math.sin(cameraYaw);
        }
        if (moveRight) {
            player.position.x += moveSpeed * Math.cos(cameraYaw);
            player.position.z -= moveSpeed * Math.sin(cameraYaw);
        }
        
        // Keep player in bounds (only X and Z)
        player.position.x = Math.max(-45, Math.min(45, player.position.x));
        player.position.z = Math.max(-45, Math.min(45, player.position.z));
        
        // Update dragon movement
        updateDragonMovement();
        
        // Third-person camera like Minecraft/Fortnite
        // Camera orbits around player based on yaw and pitch
        const cameraDistance = 15;
        
        // Calculate camera position based on yaw and pitch
        const horizontalDistance = cameraDistance * Math.cos(cameraPitch);
        const verticalDistance = cameraDistance * Math.sin(cameraPitch);
        
        camera.position.x = player.position.x - horizontalDistance * Math.sin(cameraYaw);
        camera.position.y = player.position.y + 5 + verticalDistance; // 5 units above player + vertical offset
        camera.position.z = player.position.z - horizontalDistance * Math.cos(cameraYaw);
        
        // Camera always looks at player
        camera.lookAt(player.position.clone().add(new THREE.Vector3(0, 2, 0))); // Look at player's head
        
        // Debug output occasionally
        if (Math.random() < 0.02) { // Log occasionally to avoid spam
            console.log('Camera update - Yaw:', cameraYaw, 'Pitch:', cameraPitch, 'Pos:', camera.position);
        }
        
        // Make character face the direction they're moving (not camera direction)
        if (moveForward || moveBackward || moveLeft || moveRight) {
            let moveAngle = 0;
            if (moveForward) moveAngle = cameraYaw;
            if (moveBackward) moveAngle = cameraYaw + Math.PI;
            if (moveLeft) moveAngle = cameraYaw + Math.PI/2;
            if (moveRight) moveAngle = cameraYaw - Math.PI/2;
            
            // Combine directions for diagonal movement
            if (moveForward && moveLeft) moveAngle = cameraYaw + Math.PI/4;
            if (moveForward && moveRight) moveAngle = cameraYaw - Math.PI/4;
            if (moveBackward && moveLeft) moveAngle = cameraYaw + 3*Math.PI/4;
            if (moveBackward && moveRight) moveAngle = cameraYaw - 3*Math.PI/4;
            
            player.rotation.y = moveAngle;
        }
        
        // Update crosshair position (now HTML overlay, always centered)
        // No update needed - crosshair is fixed to screen center
        
        // Update special ability cooldown
        if (specialAbilityCooldown > 0) {
            specialAbilityCooldown--;
        }
        
        // Handle auto-fire when mouse is held down
        handleAutoFire();
        
        // Handle wave spawning delays
        if (waveSpawnDelay > 0) {
            waveSpawnDelay--;
            if (waveSpawnDelay === 0) {
                spawnWaveEnemies();
            }
        }
        
        // Handle wave announcement timing
        if (waveAnnouncementTime > 0) {
            waveAnnouncementTime--;
            if (waveAnnouncementTime === 0) {
                hideWaveAnnouncement();
            }
        }
        
        // Update enemies
        updateEnemies(delta);
        
        // Update bullets
        updateBullets();
        
        // Update power-ups
        updatePowerUps();
        
        // Update particles
        updateParticles();
        
        // Spawn power-ups occasionally
        spawnPowerUps();
        
        // Update combo multiplier
        updateComboMultiplier();
        
        // Regenerate ammo slowly
        if (ammo < maxAmmo && Math.random() < 0.005 && localStorage.getItem('infiniteAmmo') !== 'true') {
            ammo++;
        }
        
        // Handle turret shooting
        if (turretActive) {
            updateTurrets();
        }
        
        // Check collisions
        checkCollisions();
        
        // Check wave completion
        checkWaveCompletion();
        
        // Update UI
        updateUI();
        
        // Check win/lose conditions
        if (health <= 0) {
            gameOver();
            return;
        }
        // Victory is now achieved by surviving waves indefinitely - no traditional victory condition
        
        renderer.render(scene, camera);
    } catch (error) {
        console.error('Animation error:', error);
        gameRunning = false;
        alert('Game error: ' + error.message);
    }
}

function updateEnemies(delta) {
    enemies.forEach(enemy => {
        // Simple AI - move towards player
        const direction = new THREE.Vector3();
        direction.subVectors(player.position, enemy.position);
        direction.y = 0;
        direction.normalize();
        
        enemy.position.add(direction.multiplyScalar(enemy.speed));
        
        // Shoot at player (only if player is visible)
        if (enemy.shootCooldown <= 0 && !isInvisible) {
            const bulletDirection = new THREE.Vector3();
            bulletDirection.subVectors(player.position, enemy.position);
            bulletDirection.normalize();
            
            createEnemyBullet(enemy.position.clone(), bulletDirection, enemy.damage || 15);
            enemy.shootCooldown = 120;
            console.log(`${enemy.enemyType || 'enemy'} shooting at visible player`);
        } else if (enemy.shootCooldown <= 0 && isInvisible) {
            console.log(`${enemy.enemyType || 'enemy'} sees invisible ninja - not shooting`);
            enemy.shootCooldown = 60; // Shorter cooldown when player is invisible
        }
        enemy.shootCooldown--;
    });
}

function createEnemyBullet(position, direction, damage) {
    const bulletGeometry = new THREE.SphereGeometry(0.1, 8, 8);
    const bulletMaterial = new THREE.MeshLambertMaterial({ color: 0xff9800 });
    const bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);
    
    bullet.position.copy(position);
    bullet.velocity = direction.multiplyScalar(0.5);
    bullet.owner = 'enemy';
    bullet.damage = damage;
    bullet.lifetime = 100;
    
    enemyBullets.push(bullet);
    scene.add(bullet);
}

function createBullet(position, direction, owner) {
    const bulletGeometry = new THREE.SphereGeometry(0.1, 8, 8);
    
    let bulletMaterial;
    let bulletSize = 0.1;
    
    if (owner === 'player') {
        // Vérifier si c'est un dragon pour les balles de feu - méthode plus fiable
        const isDragon = selectedCharacter && (
            selectedCharacter.specialAbility === 'flight' || 
            selectedCharacter.health === 200 ||
            (selectedCharacter.color && selectedCharacter.color === 0xffeb3b)
        );
        
        console.log('CreateBullet check - isDragon:', isDragon, 'owner:', owner);
        
        if (isDragon) {
            // Balles de feu pour le dragon
            bulletMaterial = new THREE.MeshBasicMaterial({ 
                color: 0xFF4500,
                emissive: 0xFF4500,
                emissiveIntensity: 0.6
            });
            bulletSize = 0.15;
        } else {
            // Balles normales pour les autres personnages
            bulletMaterial = new THREE.MeshLambertMaterial({ 
                color: 0xffeb3b
            });
        }
    } else {
        // Balles d'ennemis
        bulletMaterial = new THREE.MeshLambertMaterial({ 
            color: 0xff9800 
        });
    }
    
    const bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);
    
    bullet.position.copy(position);
    bullet.velocity = direction.multiplyScalar(0.5);
    bullet.owner = owner;
    bullet.damage = owner === 'player' ? selectedCharacter.damage : 15; // Use character damage
    bullet.lifetime = 100;
    
    bullets.push(bullet);
    scene.add(bullet);
}

function updateBullets() {
    bullets = bullets.filter(bullet => {
        bullet.position.add(bullet.velocity);
        bullet.lifetime--;
        
        // Check collisions with environment
        environment.forEach(env => {
            if (env !== bullet && bullet.owner === 'player') {
                const distance = bullet.position.distanceTo(env.position);
                if (distance < 2) {
                    bullet.dead = true;
                    // Create impact effect
                    createImpactEffect(bullet.position);
                }
            }
        });
        
        // Remove bullets marked as dead
        if (bullet.dead) {
            scene.remove(bullet);
            return false;
        }
        
        // Remove bullets that are too old or out of bounds
        if (bullet.lifetime <= 0 || 
            Math.abs(bullet.position.x) > 50 || 
            Math.abs(bullet.position.z) > 50) {
            scene.remove(bullet);
            return false;
        }
        
        return true;
    });
}

function createImpactEffect(position) {
    const impactGeometry = new THREE.SphereGeometry(0.5, 8, 8);
    const impactMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xffff00, 
        transparent: true, 
        opacity: 0.6 
    });
    const impact = new THREE.Mesh(impactGeometry, impactMaterial);
    impact.position.copy(position);
    scene.add(impact);
    
    // Remove impact effect after animation
    setTimeout(() => {
        scene.remove(impact);
    }, 200);
}

function checkCollisions() {
    // Check if player is GOD (invincible)
    const isGod = selectedCharacter && selectedCharacter.specialAbility === 'divine';
    
    // Update bullets and check collisions
    bullets = bullets.filter(bullet => {
        // Update bullet position
        bullet.position.add(bullet.velocity);
        
        // Remove bullets that are too far
        if (bullet.position.length() > 100) {
            scene.remove(bullet);
            return false;
        }
        
        // Check collision with enemies
        for (let i = enemies.length - 1; i >= 0; i--) {
            const enemy = enemies[i];
            if (!enemy) {
                continue; // Skip invalid enemies
            }
            
            const distance = bullet.position.distanceTo(enemy.position);
            
            if (distance < 1.5) {
                // Apply damage
                const oldHealth = enemy.health;
                enemy.health -= bullet.damage;
                
                console.log(`💥 Bullet hit enemy! Old health: ${oldHealth}, Damage: ${bullet.damage}, New health: ${enemy.health}`);
                
                if (enemy.health <= 0) {
                    // Enemy destroyed
                    console.log(`💀 Enemy destroyed! Score: +${enemy.score || 100}`);
                    createExplosionEffect(enemy.position);
                    scene.remove(enemy);
                    enemies.splice(i, 1);
                    
                    // Update score
                    score += enemy.score || 100;
                    totalEnemiesKilled++;
                    
                    // Update UI
                    updateUI();
                } else {
                    // Enemy hit but not destroyed
                    createHitEffect(enemy.position);
                }
                
                // Remove bullet
                scene.remove(bullet);
                return false;
            }
        }
        
        return true; // Keep bullet
    });
    
    // Update enemy bullets and check collisions
    enemyBullets = enemyBullets.filter(bullet => {
        // Update bullet position
        bullet.position.add(bullet.velocity);
        
        // Remove bullets that are too far
        if (bullet.position.length() > 100) {
            scene.remove(bullet);
            return false;
        }
        
        // Check collision with player
        if (!player) {
            return true; // Skip if no player
        }
        
        const playerDistance = bullet.position.distanceTo(player.position);
        if (playerDistance < 1) {
            let damage = bullet.damage;
            
            // Handle shield damage reduction
            if (hasShield && bullet.owner === 'enemy') {
                damage = Math.floor(damage * 0.5); // Shield blocks 50% damage
            }
            
            // Only apply damage if not GOD
            if (!isGod) {
                const oldHealth = health;
                health -= damage;
                console.log(`💔 Player hit! Old health: ${oldHealth}, Damage: ${damage}, New health: ${health}`);
            } else {
                // GOD deflects enemy bullets
                console.log('⚡ GOD deflects enemy bullet!');
                createDeflectEffect(bullet.position);
            }
            scene.remove(bullet);
            return false; // Remove bullet
        }
        
        // Check collision with turrets
        for (let i = turrets.length - 1; i >= 0; i--) {
            const turret = turrets[i];
            if (!turret || !turret.mesh) {
                continue; // Skip invalid turrets
            }
            
            const turretDistance = bullet.position.distanceTo(turret.position);
            if (turretDistance < 1.5) {
                turret.health -= bullet.damage;
                
                if (turret.health <= 0) {
                    // Turret destroyed
                    createExplosionEffect(turret.position);
                    scene.remove(turret.mesh);
                    turrets.splice(i, 1);
                    console.log('Tourelle détruite!');
                }
                return false; // Remove bullet
            }
        }
        return true; // Keep bullet
    });
    
    // Check enemy collisions with player
    if (!player) {
        return; // Skip if no player
    }
    
    enemies.forEach((enemy, enemyIndex) => {
        if (!enemy) {
            return; // Skip invalid enemies
        }
        
        const distance = enemy.position.distanceTo(player.position);
        if (distance < 2) {
            // Only apply damage if not GOD
            if (!isGod) {
                health -= 20;
                createExplosionEffect(enemy.position);
                
                // Remove enemy
                scene.remove(enemy);
                enemies.splice(enemyIndex, 1);
                
                if (health <= 0) {
                    gameOver();
                }
            } else {
                // GOD destroys enemies on contact
                console.log('⚡ GOD destroys enemy by contact!');
                createExplosionEffect(enemy.position);
                scene.remove(enemy);
                enemies.splice(enemyIndex, 1);
                score += enemy.score || 100;
                totalEnemiesKilled++;
                updateUI();
            }
        }
    });
}

function createDeflectEffect(position) {
    // Create particle effect for bullet deflection
    for (let i = 0; i < 10; i++) {
        const particleGeometry = new THREE.SphereGeometry(0.1, 8, 8);
        const particleMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xffffff, 
            transparent: true, 
            opacity: 1 
        });
        const particle = new THREE.Mesh(particleGeometry, particleMaterial);
        
        particle.position.copy(position);
        particle.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 0.5,
            (Math.random() - 0.5) * 0.5,
            (Math.random() - 0.5) * 0.5
        );
        
        scene.add(particle);
        
        // Animate particle
        let opacity = 1;
        const animateParticle = () => {
            opacity -= 0.05;
            particle.material.opacity = opacity;
            particle.position.add(particle.velocity);
            
            if (opacity <= 0) {
                scene.remove(particle);
            } else {
                requestAnimationFrame(animateParticle);
            }
        };
        animateParticle();
    }
}

function updateUI() {
    const healthElement = document.getElementById('health');
    const scoreElement = document.getElementById('score');
    const waveElement = document.getElementById('wave');
    const enemiesElement = document.getElementById('enemies');
    const totalKillsElement = document.getElementById('totalKills');
    const ammoElement = document.getElementById('ammo');
    
    // Check if player is GOD
    const isGod = selectedCharacter && selectedCharacter.specialAbility === 'divine';
    
    // Check if infinite ammo is unlocked
    const hasInfiniteAmmo = localStorage.getItem('infiniteAmmo') === 'true';
    
    if (healthElement) {
        if (isGod) {
            healthElement.textContent = 'GOD';
        } else {
            healthElement.textContent = Math.max(0, health);
        }
    }
    if (scoreElement) scoreElement.textContent = score;
    if (waveElement) waveElement.textContent = currentWave;
    if (enemiesElement) enemiesElement.textContent = enemies.length;
    if (totalKillsElement) totalKillsElement.textContent = totalEnemiesKilled;
    if (ammoElement) {
        if (hasInfiniteAmmo) {
            ammoElement.textContent = '∞';
        } else {
            ammoElement.textContent = ammo + '/' + maxAmmo;
        }
    }
    
    // Update combo display if active
    if (comboMultiplier > 1) {
        let comboElement = document.getElementById('combo');
        if (!comboElement) {
            comboElement = document.createElement('div');
            comboElement.id = 'combo';
            comboElement.style.cssText = `
                position: absolute;
                top: 120px;
                left: 10px;
                color: #FFD700;
                font-size: 1.2em;
                font-weight: bold;
                z-index: 100;
                background: rgba(0,0,0,0.7);
                padding: 5px;
                border-radius: 3px;
            `;
            document.body.appendChild(comboElement);
        }
        comboElement.textContent = `Combo x${comboMultiplier}`;
    }
}

function createMuzzleFlash(position) {
    const flashGeometry = new THREE.SphereGeometry(0.3, 6, 6);
    const flashMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xFFFF00, 
        transparent: true, 
        opacity: 0.8 
    });
    const flash = new THREE.Mesh(flashGeometry, flashMaterial);
    flash.position.copy(position);
    scene.add(flash);
    
    // Remove flash after short duration
    setTimeout(() => {
        scene.remove(flash);
    }, 50);
}

function spawnPowerUps() {
    const currentTime = Date.now();
    const spawnInterval = 15000; // Spawn every 15 seconds
    
    if (currentTime - lastPowerUpSpawn > spawnInterval && powerUps.length < 3) {
        const powerUpTypes = ['health', 'ammo', 'speed', 'damage'];
        const type = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
        
        const powerUpGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        const powerUpMaterial = new THREE.MeshBasicMaterial({ 
            color: getPowerUpColor(type),
            emissive: getPowerUpColor(type),
            emissiveIntensity: 0.5
        });
        const powerUp = new THREE.Mesh(powerUpGeometry, powerUpMaterial);
        
        // Random position within bounds
        powerUp.position.set(
            (Math.random() - 0.5) * 40,
            1,
            (Math.random() - 0.5) * 40
        );
        
        powerUp.type = type;
        powerUp.rotationSpeed = 0.05;
        powerUps.push(powerUp);
        scene.add(powerUp);
        
        lastPowerUpSpawn = currentTime;
        console.log(`Spawned ${type} power-up`);
    }
}

function getPowerUpColor(type) {
    switch(type) {
        case 'health': return 0xFF0000;
        case 'ammo': return 0x00FF00;
        case 'speed': return 0x0000FF;
        case 'damage': return 0xFF00FF;
        default: return 0xFFFFFF;
    }
}

function updatePowerUps() {
    powerUps.forEach((powerUp, index) => {
        // Rotate power-up
        powerUp.rotation.y += powerUp.rotationSpeed;
        
        // Check collection by player
        const distance = powerUp.position.distanceTo(player.position);
        if (distance < 2) {
            collectPowerUp(powerUp);
            scene.remove(powerUp);
            powerUps.splice(index, 1);
        }
    });
}

function collectPowerUp(powerUp) {
    switch(powerUp.type) {
        case 'health':
            health = Math.min(health + 25, selectedCharacter.health);
            createCollectEffect(powerUp.position, 0xFF0000);
            break;
        case 'ammo':
            ammo = maxAmmo;
            createCollectEffect(powerUp.position, 0x00FF00);
            break;
        case 'speed':
            selectedCharacter.speed *= 1.2;
            setTimeout(() => {
                selectedCharacter.speed /= 1.2;
            }, 10000);
            createCollectEffect(powerUp.position, 0x0000FF);
            break;
        case 'damage':
            selectedCharacter.damage *= 1.5;
            setTimeout(() => {
                selectedCharacter.damage /= 1.5;
            }, 8000);
            createCollectEffect(powerUp.position, 0xFF00FF);
            break;
    }
    console.log(`Collected ${powerUp.type} power-up`);
}

function createCollectEffect(position, color) {
    for (let i = 0; i < 10; i++) {
        const particleGeometry = new THREE.SphereGeometry(0.1, 4, 4);
        const particleMaterial = new THREE.MeshBasicMaterial({ 
            color: color,
            transparent: true,
            opacity: 0.8
        });
        const particle = new THREE.Mesh(particleGeometry, particleMaterial);
        
        particle.position.copy(position);
        particle.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 0.2,
            Math.random() * 0.2,
            (Math.random() - 0.5) * 0.2
        );
        particle.lifetime = 30;
        
        particles.push(particle);
        scene.add(particle);
    }
}

function updateParticles() {
    particles = particles.filter((particle, index) => {
        particle.position.add(particle.velocity);
        particle.velocity.y -= 0.01; // Gravity
        particle.lifetime--;
        particle.material.opacity = particle.lifetime / 30;
        
        if (particle.lifetime <= 0) {
            scene.remove(particle);
            return false;
        }
        return true;
    });
}

function createTurretAtPosition(position) {
    // Créer le corps de la tourelle
    const baseGeometry = new THREE.CylinderGeometry(0.8, 1.2, 0.5, 8);
    const baseMaterial = new THREE.MeshLambertMaterial({ color: 0x606060 });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    
    // Créer le canon de la tourelle
    const barrelGeometry = new THREE.CylinderGeometry(0.15, 0.15, 1.5, 8);
    const barrelMaterial = new THREE.MeshLambertMaterial({ color: 0x404040 });
    const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
    barrel.position.y = 1;
    barrel.rotation.z = Math.PI / 2;
    
    // Grouper les parties
    const turretGroup = new THREE.Group();
    turretGroup.add(base);
    turretGroup.add(barrel);
    
    // Positionner la tourelle au sol
    const turretPosition = position.clone();
    turretPosition.y = 0.25; // Au sol
    turretGroup.position.copy(turretPosition);
    
    // Ajouter les propriétés de la tourelle
    const turret = {
        mesh: turretGroup,
        barrel: barrel,
        health: 75,
        maxHealth: 75,
        damage: 15,
        fireRate: 2000, // Tire toutes les 2 secondes
        lastFireTime: 0,
        range: 25, // Portée de tir
        position: turretPosition
    };
    
    turrets.push(turret);
    scene.add(turretGroup);
    
    // Créer un effet de déploiement
    createDeployEffect(turretPosition);
}

function createDeployEffect(position) {
    const effectGeometry = new THREE.RingGeometry(1, 2, 16);
    const effectMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x00FFFF, 
        transparent: true, 
        opacity: 0.6 
    });
    const effect = new THREE.Mesh(effectGeometry, effectMaterial);
    effect.position.copy(position);
    effect.position.y = 0.1;
    effect.rotation.x = -Math.PI / 2;
    scene.add(effect);
    
    // Animation de déploiement
    let scale = 0.5;
    const expandInterval = setInterval(() => {
        scale += 0.1;
        effect.scale.set(scale, scale, 1);
        effect.material.opacity -= 0.05;
        
        if (effect.material.opacity <= 0) {
            clearInterval(expandInterval);
            scene.remove(effect);
        }
    }, 50);
}

function updateTurrets() {
    turrets = turrets.filter(turret => {
        // Vérifier si la tourelle est détruite
        if (turret.health <= 0) {
            createExplosionEffect(turret.position, 0x404040);
            scene.remove(turret.mesh);
            return false;
        }
        
        // Tourner le canon vers l'ennemi le plus proche
        const nearestEnemy = findNearestEnemy(turret.position, turret.range);
        if (nearestEnemy) {
            // Calculer la direction vers l'ennemi
            const direction = new THREE.Vector3();
            direction.subVectors(nearestEnemy.position, turret.position);
            direction.y = 0; // Garder la rotation horizontale
            direction.normalize();
            
            // Tourner le canon vers l'ennemi
            const angle = Math.atan2(direction.x, direction.z);
            turret.barrel.rotation.y = angle;
            
            // Tirer sur l'ennemi
            const currentTime = Date.now();
            if (currentTime - turret.lastFireTime > turret.fireRate) {
                turretShoot(turret, nearestEnemy);
                turret.lastFireTime = currentTime;
            }
        }
        
        return true;
    });
}

function findNearestEnemy(position, range) {
    let nearestEnemy = null;
    let nearestDistance = Infinity;
    
    enemies.forEach(enemy => {
        const distance = position.distanceTo(enemy.position);
        if (distance < range && distance < nearestDistance) {
            nearestDistance = distance;
            nearestEnemy = enemy;
        }
    });
    
    return nearestEnemy;
}

function turretShoot(turret, target) {
    // Calculer la direction de tir
    const direction = new THREE.Vector3();
    direction.subVectors(target.position, turret.position);
    direction.normalize();
    
    // Créer la balle de tourelle
    const bulletGeometry = new THREE.SphereGeometry(0.12, 8, 8);
    const bulletMaterial = new THREE.MeshLambertMaterial({ color: 0x00FFFF });
    const bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);
    
    bullet.position.copy(turret.position);
    bullet.position.y = 1; // Hauteur du canon
    bullet.velocity = direction.multiplyScalar(0.6);
    bullet.owner = 'turret';
    bullet.damage = turret.damage;
    bullet.lifetime = 80;
    
    bullets.push(bullet);
    scene.add(bullet);
    
    // Effet visuel du tir
    createMuzzleFlash(turret.mesh.position.clone().add(new THREE.Vector3(0, 1, 0)));
}

function createHitEffect(position) {
    // Create hit particles (smaller than explosion)
    for (let i = 0; i < 8; i++) {
        const particleGeometry = new THREE.SphereGeometry(0.1, 4, 4);
        const particleMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xFFA500, // Orange color for hit
            transparent: true,
            opacity: 0.8
        });
        const particle = new THREE.Mesh(particleGeometry, particleMaterial);
        
        particle.position.copy(position);
        particle.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 0.2,
            Math.random() * 0.2,
            (Math.random() - 0.5) * 0.2
        );
        particle.lifetime = 20;
        
        particles.push(particle);
        scene.add(particle);
    }
    
    // Create hit sphere (smaller than explosion)
    const hitGeometry = new THREE.SphereGeometry(0.5, 8, 8);
    const hitMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xFFA500,
        transparent: true,
        opacity: 0.4
    });
    const hitSphere = new THREE.Mesh(hitGeometry, hitMaterial);
    hitSphere.position.copy(position);
    scene.add(hitSphere);
    
    // Remove hit sphere after short time
    setTimeout(() => {
        scene.remove(hitSphere);
    }, 200);
}

function createExplosionEffect(position, color) {
    // Create explosion particles
    for (let i = 0; i < 15; i++) {
        const particleGeometry = new THREE.SphereGeometry(0.2, 4, 4);
        const particleMaterial = new THREE.MeshBasicMaterial({ 
            color: color,
            transparent: true,
            opacity: 0.9
        });
        const particle = new THREE.Mesh(particleGeometry, particleMaterial);
        
        particle.position.copy(position);
        particle.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 0.3,
            Math.random() * 0.3,
            (Math.random() - 0.5) * 0.3
        );
        particle.lifetime = 40;
        
        particles.push(particle);
        scene.add(particle);
    }
    
    // Create explosion sphere
    const explosionGeometry = new THREE.SphereGeometry(1, 8, 8);
    const explosionMaterial = new THREE.MeshBasicMaterial({ 
        color: color,
        transparent: true,
        opacity: 0.6
    });
    const explosion = new THREE.Mesh(explosionGeometry, explosionMaterial);
    explosion.position.copy(position);
    scene.add(explosion);
    
    // Animate explosion
    let scale = 1;
    const expandInterval = setInterval(() => {
        scale += 0.2;
        explosion.scale.set(scale, scale, scale);
        explosion.material.opacity -= 0.05;
        
        if (explosion.material.opacity <= 0) {
            clearInterval(expandInterval);
            scene.remove(explosion);
        }
    }, 50);
}

function createFlightEffect() {
    // Create particle trail for dragon flight
    const flightInterval = setInterval(() => {
        if (!isFlying || !player) {
            clearInterval(flightInterval);
            return;
        }
        
        // Create golden particles behind dragon
        for (let i = 0; i < 3; i++) {
            const particleGeometry = new THREE.SphereGeometry(0.1, 4, 4);
            const particleMaterial = new THREE.MeshBasicMaterial({ 
                color: 0xFFD700,
                transparent: true,
                opacity: 0.6
            });
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            
            // Position behind the dragon
            const behindPosition = player.position.clone();
            behindPosition.x -= Math.sin(cameraYaw) * 1.5;
            behindPosition.z -= Math.cos(cameraYaw) * 1.5;
            behindPosition.y = player.position.y + (Math.random() - 0.5);
            
            particle.position.copy(behindPosition);
            particle.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 0.05,
                -0.02, // Slight downward movement
                (Math.random() - 0.5) * 0.05
            );
            particle.lifetime = 30;
            
            particles.push(particle);
            scene.add(particle);
        }
    }, 100);
}

// Update the dragon movement in the main animation loop
function updateDragonMovement() {
    // More reliable dragon detection
    if (isFlying && selectedCharacter && selectedCharacter.specialAbility === 'flight') {
        // Dragon can move freely in 3D space when flying
        // No ground constraint when flying
        
        // Add slight hovering effect
        const hoverTime = Date.now() * 0.001;
        const hoverOffset = Math.sin(hoverTime * 3) * 0.1;
        
        // Apply hover to current position
        if (player.position.y > 1) {
            player.position.y += hoverOffset * 0.1;
        }
    }
}

function createDeathEffect(position, color) {
    // Create explosion particles
    for (let i = 0; i < 15; i++) {
        const particleGeometry = new THREE.SphereGeometry(0.2, 4, 4);
        const particleMaterial = new THREE.MeshBasicMaterial({ 
            color: color,
            transparent: true,
            opacity: 0.9
        });
        const particle = new THREE.Mesh(particleGeometry, particleMaterial);
        
        particle.position.copy(position);
        particle.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 0.3,
            Math.random() * 0.3,
            (Math.random() - 0.5) * 0.3
        );
        particle.lifetime = 40;
        
        particles.push(particle);
        scene.add(particle);
    }
    
    // Create explosion sphere
    const explosionGeometry = new THREE.SphereGeometry(1, 8, 8);
    const explosionMaterial = new THREE.MeshBasicMaterial({ 
        color: color,
        transparent: true,
        opacity: 0.6
    });
    const explosion = new THREE.Mesh(explosionGeometry, explosionMaterial);
    explosion.position.copy(position);
    scene.add(explosion);
    
    // Animate explosion
    let scale = 1;
    const expandInterval = setInterval(() => {
        scale += 0.2;
        explosion.scale.set(scale, scale, scale);
        explosion.material.opacity -= 0.05;
        
        if (explosion.material.opacity <= 0) {
            clearInterval(expandInterval);
            scene.remove(explosion);
        }
    }, 50);
}

function updateComboMultiplier() {
    const currentTime = Date.now();
    const comboTimeout = 3000; // 3 seconds to maintain combo
    
    if (currentTime - lastKillTime > comboTimeout && comboMultiplier > 1) {
        comboMultiplier = 1;
        console.log('Combo reset');
    }
}

function gameOver() {
    gameRunning = false;
    const finalScoreElement = document.getElementById('finalScore');
    const gameOverElement = document.getElementById('gameOver');
    
    if (finalScoreElement) finalScoreElement.textContent = score;
    if (gameOverElement) gameOverElement.style.display = 'block';
}

function victory() {
    gameRunning = false;
    const victoryScoreElement = document.getElementById('victoryScore');
    const victoryElement = document.getElementById('victory');
    
    if (victoryScoreElement) victoryScoreElement.textContent = score;
    if (victoryElement) victoryElement.style.display = 'block';
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onKeyDown(event) {
    // Cheat: Press P+M during gameplay to gain massive score + jump to wave 9999999
    const keyLower = typeof event.key === 'string' ? event.key.toLowerCase() : '';
    if (event.code === 'KeyP' || keyLower === 'p') cheatPPressed = true;
    if (event.code === 'KeyM' || keyLower === 'm') cheatMPressed = true;

    if (gameRunning && !cheatPMTriggered && cheatPPressed && cheatMPressed) {
        cheatPMTriggered = true;
        event.preventDefault();
        score += 100000000000000000;
        // Jump to an extreme wave number
        if (scene && Array.isArray(enemies) && enemies.length > 0) {
            enemies.forEach(enemy => {
                try {
                    scene.remove(enemy);
                } catch (e) {
                    // ignore
                }
            });
        }
        enemies = [];
        startWave(9999999);
        updateUI();
        console.log('CHEAT ACTIVATED (P+M): +100000000000000000 score and wave 9999999');
        return;
    }

    switch (event.code) {
        case 'KeyZ': // Z for forward (French keyboard)
        case 'KeyW': // W for forward (US keyboard)
            moveForward = true;
            break;
        case 'KeyS': // S for backward
            moveBackward = true;
            break;
        case 'KeyQ': // Q for left (French keyboard)
        case 'KeyA': // A for left (US keyboard)
            moveLeft = true;
            break;
        case 'KeyD': // D for right
            moveRight = true;
            break;
        case 'Space': // Space for special ability (toggle)
            toggleSpecialAbility();
            break;
        case 'KeyY': // Y to toggle camera lock
            cameraLocked = !cameraLocked;
            console.log(cameraLocked ? 'Camera Locked' : 'Camera Unlocked');
            break;
    }
}

function onKeyUp(event) {
    switch (event.code) {
        case 'KeyP':
            cheatPPressed = false;
            cheatPMTriggered = false;
            break;
        case 'KeyM':
            cheatMPressed = false;
            cheatPMTriggered = false;
            break;
        case 'KeyZ':
        case 'KeyW':
            moveForward = false;
            break;
        case 'KeyS':
            moveBackward = false;
            break;
        case 'KeyQ':
            moveLeft = false;
            break;
        case 'KeyD':
            moveRight = false;
            break;
    }
}

function onPointerLockChange() {
    if (document.pointerLockElement === document.body) {
        console.log('Mouse locked');
    } else {
        console.log('Mouse unlocked');
    }
}

function onMouseDown(event) {
    isMouseDown = true;
    autoFire = true;
}

function onMouseUp(event) {
    isMouseDown = false;
    autoFire = false;
}

function onMouseMove(event) {
    if (document.pointerLockElement === document.body) {
        // Mouse is locked - use movement for camera control like Minecraft/Fortnite
        const sensitivity = 0.002;
        
        // Update camera angles based on mouse movement
        cameraYaw -= (event.movementX || event.mozMovementX || event.webkitMovementX || 0) * sensitivity;
        cameraPitch += (event.movementY || event.mozMovementY || event.webkitMovementY || 0) * sensitivity; // Inverted Y axis
        
        // Clamp pitch to prevent camera flipping
        cameraPitch = Math.max(-Math.PI/2, Math.min(Math.PI/2, cameraPitch)); // Between -90° and 90° for full vertical movement
        
        // Dragon flight control with mouse - more reliable detection
        if (isFlying && selectedCharacter && selectedCharacter.specialAbility === 'flight') {
            // Control dragon altitude with mouse pitch - INVERTED
            // cameraPitch: -π/2 (look straight down) to +π/2 (look straight up)
            // Map this to height: 25 (max height) to 0 (ground) - INVERTED
            const normalizedPitch = 1 - ((cameraPitch + Math.PI/2) / Math.PI); // 1 to 0 (inverted)
            const targetHeight = normalizedPitch * 25; // 25 to 0 units (inverted)
            
            // Apply altitude change
            const heightDiff = targetHeight - player.position.y;
            player.position.y += heightDiff * 0.1; // Smooth transition
            
            // Limit height to reasonable bounds
            player.position.y = Math.max(0.5, Math.min(25, player.position.y));
            
            // Debug every frame when flying
            console.log('FLIGHT DEBUG - Pitch:', cameraPitch.toFixed(3), 'Normalized:', normalizedPitch.toFixed(3), 'TargetHeight:', targetHeight.toFixed(1), 'CurrentHeight:', player.position.y.toFixed(1), 'HeightDiff:', heightDiff.toFixed(1));
        }
        
        // Debug output occasionally
        if (Math.random() < 0.05) { // Log occasionally to avoid spam
            console.log('Mouse camera - Yaw:', cameraYaw, 'Pitch:', cameraPitch);
        }
    } else {
        // Mouse is not locked - use absolute position
        mouseX = event.clientX;
        mouseY = event.clientY;
    }
}

function onMouseClick(event) {
    if (!gameRunning) return;
    
    // Check if infinite ammo is unlocked
    const hasInfiniteAmmo = localStorage.getItem('infiniteAmmo') === 'true';
    
    if (!hasInfiniteAmmo && ammo <= 0) return;
    
    if (!hasInfiniteAmmo) {
        ammo--;
    }
    
    // Vérifier si le joueur est un dragon pour le tir de feu - méthode plus fiable
    const isDragon = selectedCharacter && (
        selectedCharacter.specialAbility === 'flight' || 
        selectedCharacter.health === 200 ||
        (selectedCharacter.color && selectedCharacter.color === 0xffeb3b)
    );
    
    console.log('Fire check - isDragon:', isDragon, 'selectedCharacter:', selectedCharacter, 'infiniteAmmo:', hasInfiniteAmmo);
    
    if (isDragon) {
        // Dragon lance du feu
        shootDragonFire();
    } else {
        // Tir normal pour les autres personnages
        shootNormalBullet();
    }
    
    // Create muzzle flash effect
    const bulletPosition = player.position.clone();
    bulletPosition.y += 1;
    createMuzzleFlash(bulletPosition);
}

function shootNormalBullet() {
    // Use raycasting from screen center (crosshair position)
    mouseVector.x = 0; // Center of screen (crosshair is always centered)
    mouseVector.y = 0;
    
    // Update raycaster with camera and crosshair position
    raycaster.setFromCamera(mouseVector, camera);
    
    // Shooting direction is exactly where crosshair points
    const shootDirection = raycaster.ray.direction.clone();
    shootDirection.normalize();
    
    // Debug output
    console.log('Shooting - Direction:', shootDirection, 'Crosshair raycast from center');
    
    // Create bullet at player position with accurate direction
    const bulletPosition = player.position.clone();
    bulletPosition.y += 1; // Shoot from chest height
    
    createBullet(bulletPosition, shootDirection, 'player');
}

function shootDragonFire() {
    // Use raycasting from screen center (crosshair position)
    mouseVector.x = 0; // Center of screen (crosshair is always centered)
    mouseVector.y = 0;
    
    // Update raycaster with camera and crosshair position
    raycaster.setFromCamera(mouseVector, camera);
    
    // Shooting direction is exactly where crosshair points
    const shootDirection = raycaster.ray.direction.clone();
    shootDirection.normalize();
    
    // Create fire stream (multiple fire particles)
    const firePosition = player.position.clone();
    firePosition.y += 1.5; // Shoot from mouth height
    
    for (let i = 0; i < 5; i++) {
        const fireGeometry = new THREE.SphereGeometry(0.3, 6, 6);
        const fireMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xFF4500,
            emissive: 0xFF4500,
            emissiveIntensity: 0.8
        });
        const fireBall = new THREE.Mesh(fireGeometry, fireMaterial);
        
        fireBall.position.copy(firePosition);
        
        // Add some spread to the fire
        const spread = 0.1;
        const direction = shootDirection.clone();
        direction.x += (Math.random() - 0.5) * spread;
        direction.y += (Math.random() - 0.5) * spread;
        direction.z += (Math.random() - 0.5) * spread;
        direction.normalize();
        
        fireBall.velocity = direction.multiplyScalar(0.8);
        fireBall.owner = 'player';
        fireBall.damage = selectedCharacter.damage * 1.5; // Dragon fire does more damage
        fireBall.lifetime = 60;
        fireBall.isFire = true; // Mark as fire projectile
        
        bullets.push(fireBall);
        scene.add(fireBall);
    }
    
    console.log('🐉 Dragon crache le feu!');
}

function handleAutoFire() {
    if (!gameRunning || !autoFire) return;
    
    // Check if infinite ammo is unlocked
    const hasInfiniteAmmo = localStorage.getItem('infiniteAmmo') === 'true';
    
    if (!hasInfiniteAmmo && ammo <= 0) return;
    
    const currentTime = Date.now();
    const fireRate = 100; // Fire every 100ms (10 shots per second)
    
    if (currentTime - lastFireTime > fireRate) {
        if (!hasInfiniteAmmo) {
            ammo--;
        }
        
        // Vérifier si le joueur est un dragon pour le tir de feu - méthode plus fiable
        const isDragon = selectedCharacter && (
            selectedCharacter.specialAbility === 'flight' || 
            selectedCharacter.health === 200 ||
            (selectedCharacter.color && selectedCharacter.color === 0xffeb3b)
        );
        
        if (isDragon) {
            // Dragon lance du feu en auto-fire
            shootDragonFire();
        } else {
            // Tir normal pour les autres personnages
            shootNormalBullet();
        }
        
        // Create muzzle flash effect
        const bulletPosition = player.position.clone();
        bulletPosition.y += 1;
        createMuzzleFlash(bulletPosition);
        
        lastFireTime = currentTime;
    }
}

function toggleSpecialAbility() {
    // Determine character type by matching selectedCharacter with characterStats
    let characterType = 'default';
    
    // More reliable character detection using multiple properties
    for (const [key, value] of Object.entries(characterStats)) {
        if (value.health === selectedCharacter.health && 
            value.speed === selectedCharacter.speed && 
            value.damage === selectedCharacter.damage) {
            characterType = key;
            break;
        }
    }
    
    console.log('Character type detected:', characterType, 'Selected character:', selectedCharacter);
    console.log('Character stats comparison:');
    console.log('- Selected health:', selectedCharacter.health);
    console.log('- Selected speed:', selectedCharacter.speed);
    console.log('- Selected damage:', selectedCharacter.damage);
    console.log('- Selected ability:', selectedCharacter.specialAbility);
    
    const ability = characterStats[characterType]?.specialAbility || 'none';
    
    console.log('Attempting ability:', ability, 'for character type:', characterType);
    
    switch(ability) {
        case 'divine': // GOD
            console.log('⚡ Divine power activated! Killing all enemies!');
            instantKillAllEnemies();
            break;
            
        case 'flight': // Dragon
            specialAbilityActive = !specialAbilityActive;
            isFlying = !isFlying;
            
            console.log('Flight toggle - isFlying:', isFlying, 'selectedCharacter:', selectedCharacter);
            
            if (isFlying) {
                // Start flying
                player.position.y = 10; // Start at medium height
                selectedCharacter.speed = 8; // Increase speed when flying
                
                // Create wing effect
                const wingGeometry = new THREE.BoxGeometry(4, 0.1, 2);
                const wingMaterial = new THREE.MeshBasicMaterial({ 
                    color: 0xffeb3b, 
                    transparent: true, 
                    opacity: 0.7 
                });
                const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
                leftWing.position.set(-2, 0, 0);
                player.add(leftWing);
                
                const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
                rightWing.position.set(2, 0, 0);
                player.add(rightWing);
                
                // Create flight particles
                createFlightEffect();
                
                console.log('🐉 Dragon prend son envol! Utilisez la souris pour contrôler l\'altitude.');
                console.log('Instructions: Souris vers le BAS = descendre, vers le HAUT = monter (INVERSE)');
            } else {
                // Stop flying
                player.position.y = 1; // Return to ground
                selectedCharacter.speed = 2; // Return to normal speed
                
                // Remove wings safely
                const wingsToRemove = [];
                player.children.forEach(child => {
                    if (child.geometry && child.geometry.type === 'BoxGeometry' && 
                        child.geometry.parameters.width === 4 && child.geometry.parameters.height === 0.1) {
                        wingsToRemove.push(child);
                    }
                });
                wingsToRemove.forEach(wing => player.remove(wing));
                
                console.log('🐉 Dragon atterrit!');
            }
            break;
            
        case 'invisibility': // Ninja
            specialAbilityActive = !specialAbilityActive;
            isInvisible = !isInvisible;
            
            if (isInvisible) {
                // Apply invisibility to all child meshes
                if (player.children) {
                    player.children.forEach(child => {
                        if (child.material) {
                            child.material = new THREE.MeshBasicMaterial({ 
                                color: 0x2F4F4F, 
                                transparent: true, 
                                opacity: 0.3 
                            });
                        }
                    });
                }
                if (player.material) {
                    player.material = new THREE.MeshBasicMaterial({ 
                        color: 0x2F4F4F, 
                        transparent: true, 
                        opacity: 0.3 
                    });
                }
                console.log('🥷 Ninja devient invisible!');
            } else {
                // Restore visibility to all child meshes
                if (player.children) {
                    player.children.forEach(child => {
                        if (child.material) {
                            child.material = new THREE.MeshLambertMaterial({ color: 0x2F4F4F });
                        }
                    });
                }
                if (player.material) {
                    player.material = new THREE.MeshLambertMaterial({ color: 0x2F4F4F });
                }
                console.log('🥷 Ninja redevient visible!');
            }
            break;
            
        case 'shield': // Warrior
            specialAbilityActive = !specialAbilityActive;
            hasShield = !hasShield;
            
            if (hasShield) {
                // Create shield visual
                const shieldGeometry = new THREE.SphereGeometry(3, 16, 16);
                const shieldMaterial = new THREE.MeshBasicMaterial({ 
                    color: 0x00BFFF, 
                    transparent: true, 
                    opacity: 0.5 
                });
                shieldMesh = new THREE.Mesh(shieldGeometry, shieldMaterial);
                player.add(shieldMesh);
                console.log('⚔️ Warrior active son bouclier!');
            } else {
                // Remove shield
                if (shieldMesh) {
                    player.remove(shieldMesh);
                    shieldMesh = null;
                }
                console.log('⚔️ Warrior désactive son bouclier!');
            }
            break;
            
        case 'turret': // Robot
            specialAbilityActive = !specialAbilityActive;
            turretActive = !turretActive;
            
            if (turretActive) {
                // Créer une tourelle au sol
                createTurretAtPosition(player.position);
                console.log('🤖 Robot déploie une tourelle au sol!');
            } else {
                // Retirer toutes les tourelles
                turrets.forEach(turret => {
                    scene.remove(turret.mesh);
                });
                turrets = [];
                console.log('🤖 Robot retire ses tourelles!');
            }
            break;
            
        case 'teleport': // Alien
            if (!specialAbilityActive) {
                // Teleport to random location
                const teleportX = (Math.random() - 0.5) * 40;
                const teleportZ = (Math.random() - 0.5) * 40;
                
                // Create teleport effect
                const effectGeometry = new THREE.SphereGeometry(3, 16, 16);
                const effectMaterial = new THREE.MeshBasicMaterial({ 
                    color: 0x00FF00, 
                    transparent: true, 
                    opacity: 0.5 
                });
                const effect = new THREE.Mesh(effectGeometry, effectMaterial);
                effect.position.copy(player.position);
                scene.add(effect);
                
                // Teleport player
                player.position.set(teleportX, 1, teleportZ);
                
                // Create arrival effect
                const arrivalEffect = new THREE.Mesh(effectGeometry, effectMaterial);
                arrivalEffect.position.copy(player.position);
                scene.add(arrivalEffect);
                
                // Remove effects after delay
                setTimeout(() => {
                    scene.remove(effect);
                    scene.remove(arrivalEffect);
                }, 1000);
                
                console.log('👽 Alien se téléporte!');
            }
            // Teleport is instant, no toggle state
            break;
            
        case 'fireball': // Mage
            if (!specialAbilityActive) {
                // Create fireball
                const fireballGeometry = new THREE.SphereGeometry(0.5, 8, 8);
                const fireballMaterial = new THREE.MeshBasicMaterial({ 
                    color: 0xFF4500,
                    emissive: 0xFF4500
                });
                const fireball = new THREE.Mesh(fireballGeometry, fireballMaterial);
                
                // Position fireball at player position
                fireball.position.copy(player.position);
                fireball.position.y += 1;
                
                // Use raycasting for accurate crosshair targeting
                mouseVector.x = 0; // Center of screen (crosshair is always centered)
                mouseVector.y = 0;
                
                // Update raycaster with camera and mouse position
                raycaster.setFromCamera(mouseVector, camera);
                
                // Calculate fireball direction
                const direction = new THREE.Vector3();
                raycaster.ray.direction.normalize();
                direction.copy(raycaster.ray.direction);
                
                scene.add(fireball);
                
                // Animate fireball
                const fireballSpeed = 0.5;
                const fireballInterval = setInterval(() => {
                    fireball.position.add(direction.clone().multiplyScalar(fireballSpeed));
                    
                    // Check collision with enemies
                    enemies.forEach((enemy, index) => {
                        const distance = fireball.position.distanceTo(enemy.position);
                        if (distance < 2) {
                            // Damage enemy
                            enemy.health -= 50;
                            if (enemy.health <= 0) {
                                scene.remove(enemy);
                                enemies.splice(index, 1);
                                score += 100;
                            }
                            
                            // Create explosion effect
                            const explosionGeometry = new THREE.SphereGeometry(2, 8, 8);
                            const explosionMaterial = new THREE.MeshBasicMaterial({ 
                                color: 0xFF6600, 
                                transparent: true, 
                                opacity: 0.7 
                            });
                            const explosion = new THREE.Mesh(explosionGeometry, explosionMaterial);
                            explosion.position.copy(enemy.position);
                            scene.add(explosion);
                            
                            setTimeout(() => {
                                scene.remove(explosion);
                            }, 500);
                            
                            // Remove fireball
                            scene.remove(fireball);
                            clearInterval(fireballInterval);
                        }
                    });
                    
                    // Remove fireball if out of bounds
                    if (Math.abs(fireball.position.x) > 50 || Math.abs(fireball.position.z) > 50) {
                        scene.remove(fireball);
                        clearInterval(fireballInterval);
                    }
                }, 16);
                
                console.log('🧙‍♂️ Mage lance une boule de feu!');
            }
            // Fireball is instant, no toggle state
            break;
            
        default:
            console.log('Ce personnage n\'a pas de capacité spéciale.');
    }
}

// Character Selection Functions
function showCharacterSelection() {
    const characterGrid = document.getElementById('characterGrid');
    characterGrid.innerHTML = '';
    
    // Check if SECRET is unlocked
    const secretUnlocked = localStorage.getItem('secretUnlocked') === 'true';
    // Check if GOD is unlocked (for backward compatibility)
    const godUnlocked = localStorage.getItem('godUnlocked') === 'true';
    
    const characters = [
        { type: 'warrior', name: '⚔️ Warrior', health: 120, speed: 4, damage: 25, color: '#8B4513', ability: 'Shield Block' },
        { type: 'ninja', name: '🥷 Ninja', health: 90, speed: 5, damage: 20, color: '#2F4F4F', ability: 'Invisibility' },
        { type: 'mage', name: '🧙‍♂️ Mage', health: 80, speed: 3, damage: 30, color: '#4B0082', ability: 'Fireball' },
        { type: 'robot', name: '🤖 Robot', health: 150, speed: 3, damage: 25, color: '#708090', ability: 'Turret' },
        { type: 'alien', name: '👽 Alien', health: 100, speed: 4, damage: 20, color: '#00FF00', ability: 'Teleport' },
        { type: 'dragon', name: '🐉 Dragon', health: 200, speed: 2, damage: 35, color: '#FFEB3B', ability: 'Flight' }
    ];
    
    // Add SECRET character if unlocked
    if (secretUnlocked || godUnlocked) {
        characters.push({ 
            type: 'secret', 
            name: '🤫 SECRET', 
            health: 999999, 
            speed: 10, 
            damage: 999, 
            color: '#FFFFFF', 
            ability: 'Divine Strike' 
        });
    }
    
    characters.forEach(char => {
        const charDiv = document.createElement('div');
        
        // Special styling for SECRET character
        if (char.type === 'secret') {
            charDiv.style.cssText = `
                background: linear-gradient(135deg, rgba(138, 43, 226, 0.2), rgba(75, 0, 130, 0.3));
                border: 3px solid rgba(138, 43, 226, 0.8);
                border-radius: 15px;
                padding: 20px;
                cursor: pointer;
                transition: all 0.3s ease;
                text-align: center;
                box-shadow: 0 0 20px rgba(138, 43, 226, 0.5);
                position: relative;
            `;
            
            // Add mysterious glow effect
            const glowDiv = document.createElement('div');
            glowDiv.style.cssText = `
                position: absolute;
                top: -5px;
                left: -5px;
                right: -5px;
                bottom: -5px;
                background: linear-gradient(45deg, #8A2BE2, #FF6B6B, #4A90E2, #8A2BE2);
                border-radius: 15px;
                z-index: -1;
                animation: mysteriousGlow 2s ease-in-out infinite;
            `;
            charDiv.appendChild(glowDiv);
        } else if (char.type === 'god') {
            charDiv.style.cssText = `
                background: linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(255, 215, 0, 0.3));
                border: 3px solid rgba(255, 215, 0, 0.8);
                border-radius: 15px;
                padding: 20px;
                cursor: pointer;
                transition: all 0.3s ease;
                text-align: center;
                box-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
                position: relative;
            `;
            
            // Add divine glow effect
            const glowDiv = document.createElement('div');
            glowDiv.style.cssText = `
                position: absolute;
                top: -5px;
                left: -5px;
                right: -5px;
                bottom: -5px;
                background: linear-gradient(45deg, #FFD700, #FFA500, #FFD700);
                border-radius: 15px;
                z-index: -1;
                animation: divineGlow 2s ease-in-out infinite;
            `;
            charDiv.appendChild(glowDiv);
        } else {
            charDiv.style.cssText = `
                background: rgba(255,255,255,0.1);
                border: 2px solid rgba(255,255,255,0.3);
                border-radius: 10px;
                padding: 15px;
                cursor: pointer;
                transition: all 0.3s ease;
                text-align: center;
            `;
        }
        
        charDiv.innerHTML = `
            <div style="position: relative; z-index: 1;">
                <h3 style="margin: 0 0 10px 0; ${char.type === 'secret' ? 'color: #8A2BE2; text-shadow: 0 0 10px rgba(138, 43, 226, 0.8);' : char.type === 'god' ? 'color: #FFD700; text-shadow: 0 0 10px rgba(255, 215, 0, 0.8);' : ''}">${char.name}</h3>
                <div style="font-size: 12px; margin: 10px 0;">
                    <div>❤️ Health: ${char.health.toLocaleString()}</div>
                    <div>⚡ Speed: ${char.speed}</div>
                    <div>⚔️ Damage: ${char.damage}</div>
                    <div>🌟 Ability: ${char.ability}</div>
                </div>
                <div style="width: 30px; height: 30px; background: ${char.color}; border-radius: 50%; margin: 0 auto; border: 2px solid #fff; ${char.type === 'secret' ? 'box-shadow: 0 0 15px rgba(138, 43, 226, 0.8);' : char.type === 'god' ? 'box-shadow: 0 0 15px rgba(255, 255, 255, 0.8);' : ''}"></div>
            </div>
        `;
        
        charDiv.addEventListener('click', () => selectCharacter(char));
        charDiv.addEventListener('mouseenter', () => {
            if (char.type === 'secret') {
                charDiv.style.transform = 'scale(1.1)';
                charDiv.style.boxShadow = '0 0 30px rgba(138, 43, 226, 0.8)';
            } else if (char.type === 'god') {
                charDiv.style.transform = 'scale(1.1)';
                charDiv.style.boxShadow = '0 0 30px rgba(255, 215, 0, 0.8)';
            } else {
                charDiv.style.background = 'rgba(255,255,255,0.2)';
                charDiv.style.transform = 'scale(1.05)';
            }
        });
        charDiv.addEventListener('mouseleave', () => {
            if (char.type === 'secret') {
                charDiv.style.transform = 'scale(1)';
                charDiv.style.boxShadow = '0 0 20px rgba(138, 43, 226, 0.5)';
            } else if (char.type === 'god') {
                charDiv.style.transform = 'scale(1)';
                charDiv.style.boxShadow = '0 0 20px rgba(255, 215, 0, 0.5)';
            } else {
                charDiv.style.background = 'rgba(255,255,255,0.1)';
                charDiv.style.transform = 'scale(1)';
            }
        });
        
        characterGrid.appendChild(charDiv);
    });
    
    document.getElementById('characterSelection').style.display = 'block';
}

function hideCharacterSelection() {
    document.getElementById('characterSelection').style.display = 'none';
}

function selectCharacter(character) {
    // Map character types to characterStats
    const characterMap = {
        'warrior': characterStats.soldier,
        'ninja': characterStats.ninja,
        'mage': characterStats.soldier, // Use soldier stats for mage
        'robot': characterStats.robot,
        'alien': characterStats.soldier, // Use soldier stats for alien
        'dragon': characterStats.dragon,
        'secret': characterStats.secret,
        'god': characterStats.god
    };
    
    // Map character type to ability
    const abilityMap = {
        'warrior': 'shield',
        'ninja': 'invisibility', 
        'mage': 'fireball',
        'robot': 'turret',
        'alien': 'teleport',
        'dragon': 'flight',
        'secret': 'divine',
        'god': 'divine'
    };
    
    selectedCharacter = characterMap[character.type] || characterStats.soldier;
    health = selectedCharacter.health;
    
    // Save to localStorage
    localStorage.setItem('selectedCharacter', JSON.stringify(selectedCharacter));
    
    // Update menu display
    const characterInfo = document.getElementById('characterInfo');
    if (characterInfo) {
        if (character.type === 'secret' || character.type === 'god') {
            characterInfo.innerHTML = `
                <div style="color: ${character.type === 'secret' ? '#8A2BE2' : '#FFD700'}; font-weight: bold; text-shadow: 0 0 10px rgba(${character.type === 'secret' ? '138, 43, 226' : '255, 215, 0'}, 0.8);">
                    ${character.type === 'secret' ? '🤫' : '⚡'} ${character.name} - Divine Power Unlocked!
                </div>
                <div style="font-size: 0.9em; margin-top: 5px;">
                    Health: ${character.health.toLocaleString()} | Speed: ${character.speed} | Damage: ${character.damage}
                </div>
                <div style="font-size: 0.8em; color: ${character.type === 'secret' ? '#8A2BE2' : '#FFD700'}; margin-top: 3px;">
                    🌟 Ability: ${character.ability}
                </div>
            `;
        } else {
            characterInfo.textContent = `${character.name} - Health: ${character.health}, Speed: ${character.speed}, Damage: ${character.damage}`;
        }
    }
    
    // Hide character selection
    hideCharacterSelection();
    
    console.log('Character selected:', character.type, selectedCharacter);
}

// If player already exists, recreate it with new character
if (player && scene) {
    scene.remove(player);
    createPlayer();
}

// Initialize the game when page loads
window.addEventListener('load', function() {
    console.log('Page loaded, initializing 3D game...');
    init();
});
