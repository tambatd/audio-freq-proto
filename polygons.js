class AudioManager {
  constructor() {
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }

  playTone(sides, volume) {
    // Create oscillator
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    // Set frequency based on number of sides
    // Using a pentatonic scale for pleasant sounds
    const baseFrequency = 220; // A3
    const pentatonic = [0, 2, 4, 7, 9, 12, 14, 16]; // Pentatonic scale in semitones
    const semitone = pentatonic[(sides - 3) % pentatonic.length];
    const frequency = baseFrequency * Math.pow(2, semitone / 12);
    
    oscillator.type = sides % 2 === 0 ? 'sine' : 'triangle'; // Even sides get sine waves, odd get triangles
    oscillator.frequency.value = frequency;
    
    // Connect and play
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    // Short beep with given volume
    gainNode.gain.value = 0;
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume * 0.3, this.audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.2);
    
    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + 0.2);
  }

  playSound(sides) {
    // Create oscillator
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    // Set frequency based on number of sides
    // Using a pentatonic scale for pleasant sounds
    const baseFrequency = 220; // A3
    const pentatonic = [0, 2, 4, 7, 9, 12, 14, 16]; // Pentatonic scale in semitones
    const semitone = pentatonic[(sides - 3) % pentatonic.length];
    const frequency = baseFrequency * Math.pow(2, semitone / 12);
    
    oscillator.type = sides % 2 === 0 ? 'sine' : 'triangle'; // Even sides get sine waves, odd get triangles
    oscillator.frequency.value = frequency;
    
    // Connect and play
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    // Envelope for the sound
    gainNode.gain.value = 0;
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 1.5);
    
    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + 1.5);
  }
}

class StaffManager {
  constructor(engine, containerWidth, containerHeight) {
    this.engine = engine;
    this.containerWidth = containerWidth;
    this.containerHeight = containerHeight;
    
    // Map notes to positions (adjusted to match staff lines)
    this.notePositions = [
      {x: 90, y: 70},  // E (bottom line)
      {x: 90, y: 65},  // F (space)
      {x: 90, y: 60},  // G (line)
      {x: 90, y: 55},  // A (space)
      {x: 90, y: 50},  // B (line)
      {x: 90, y: 45},  // C (space)
      {x: 90, y: 40},  // D (line)
      {x: 90, y: 35},  // E (space)
      {x: 90, y: 30},  // F (top line)
    ];
    
    // Track current position for note placement
    this.currentNoteX = 90;
    this.noteSpacing = 30;
    this.maxNoteX = 740;
    this.notes = []; // Add an array to track all notes
    
    // Map keys to notes (A-K) - Restructured so 'a' is C note
    this.keyNotes = {
      'a': 5, // C
      's': 6, // D
      'd': 7, // E
      'f': 0, // E (lower)
      'g': 1, // F
      'h': 2, // G
      'j': 3, // A
      'k': 4  // B
    };
    
    // Enhance staff visibility
    setTimeout(() => {
      const staffContainer = document.getElementById('staff-container');
      if (staffContainer) {
        staffContainer.style.opacity = '1';
        console.log('Staff visibility enhanced');
      } else {
        console.log('Staff container not found');
      }
    }, 500);
  }

  placeNoteOnStaff(key, audioManager) {
    // If the key doesn't have a note mapping, skip
    if (!(key in this.keyNotes)) return;
    
    // Check if we need to clear the staff
    if (this.currentNoteX > this.maxNoteX) {
      this.clearStaff();
    }
    
    const noteIndex = this.keyNotes[key];
    const sides = key in PhysicsPolygons.keySides ? PhysicsPolygons.keySides[key] : Math.floor(Math.random() * 8) + 3;
    
    // Get position for this note
    const yPos = this.notePositions[noteIndex].y;
    const xPos = this.currentNoteX;
    
    // Create a DOM element for the note instead of a physics body
    const staffContainer = document.getElementById('staff-container');
    if (staffContainer) {
      const noteElement = document.createElement('div');
      noteElement.className = 'note';
      noteElement.style.position = 'absolute';
      noteElement.style.left = xPos + 'px';
      noteElement.style.top = yPos + 'px';
      noteElement.style.width = '12px';
      noteElement.style.height = '12px';
      noteElement.style.borderRadius = '50%';
      noteElement.style.backgroundColor = 'white';
      noteElement.style.transform = 'translateY(-50%)';
      
      staffContainer.appendChild(noteElement);
      
      // Add to our notes array
      this.notes.push(noteElement);
    }
    
    // Play sound for this note
    audioManager.playSound(sides);
    
    // Move to next position
    this.currentNoteX += this.noteSpacing;
  }
  
  clearStaff() {
    // Remove all note elements
    this.notes.forEach(note => {
      if (note.parentNode) {
        note.parentNode.removeChild(note);
      }
    });
    
    // Clear the notes array
    this.notes = [];
    
    // Reset position
    this.currentNoteX = 90;
  }
}

class PhysicsPolygons {
  constructor(containerWidth, containerHeight) {
    // Matter.js module aliases
    this.Matter = Matter;
    const { Engine, Render, Runner, Bodies, Composite, Common, Body } = Matter;
    
    // Create engine and renderer
    this.engine = Engine.create({
      positionIterations: 8,
      velocityIterations: 8
    });
    this.runner = Runner.create();
    
    this.container = document.getElementById('canvas-container');
    this.containerWidth = containerWidth;
    this.containerHeight = containerHeight;
    
    this.render = Render.create({
      element: this.container,
      engine: this.engine,
      options: {
        width: this.containerWidth,
        height: this.containerHeight,
        wireframes: false,
        background: 'black',
        showSleeping: false,
        pixelRatio: 'auto',
        hasBounds: false
      }
    });
    
    // Initialize managers
    this.audioManager = new AudioManager();
    this.staffManager = new StaffManager(this.engine, containerWidth, containerHeight);
    
    // Counter for statistics only
    this.bodyCount = 0;
    
    // Track keys currently being pressed and growing polygons
    this.keysPressed = {};
    this.growingPolygons = {};
    
    // Create walls
    this.createBoundaries();
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Start the update loop
    this.update();
    
    // Start the engine and renderer
    Runner.run(this.runner, this.engine);
    Render.run(this.render);
  }

  // Static properties - Updated to ensure keys map directly to number of sides
  static keySides = {
    'a': 3, // triangle
    's': 4, // square
    'd': 5, // pentagon
    'f': 6, // hexagon
    'g': 7, // heptagon
    'h': 8, // octagon
    'j': 9, // nonagon
    'k': 10 // decagon
  };

  createBoundaries() {
    const { Bodies, Composite } = this.Matter;
    
    // Calculate position to center the boundaries in the larger canvas
    const offsetX = (this.containerWidth - 800) / 2;
    const offsetY = (this.containerHeight - 500) / 2;
    
    // Store these offsets for use in other methods
    this.boundaryOffsetX = offsetX;
    this.boundaryOffsetY = offsetY;
    this.physicsWidth = 800;
    this.physicsHeight = 500;
    
    // Create ground (bottom wall) - extended 15px on each side
    const groundWidth = this.physicsWidth + 30; // Add 30px (15px on each side)
    const ground = Bodies.rectangle(
      this.physicsWidth / 2 + offsetX, // Keep the center position the same
      this.physicsHeight + offsetY, 
      groundWidth, 
      25,
      {
        isStatic: true,
        render: {
          fillStyle: 'transparent',
          strokeStyle: 'white',
          lineWidth: 1
        },
        collisionFilter: {
          group: 1
        }
      }
    );
    
    // Create left wall - reduced thickness from 50 to 25
    const leftWall = Bodies.rectangle(
      offsetX,
      this.physicsHeight / 2 + offsetY,
      25,
      this.physicsHeight,
      {
        isStatic: true,
        render: {
          fillStyle: 'transparent',
          strokeStyle: 'white',
          lineWidth: 1
        }
      }
    );
    
    // Create right wall - reduced thickness from 50 to 25
    const rightWall = Bodies.rectangle(
      this.physicsWidth + offsetX,
      this.physicsHeight / 2 + offsetY,
      25,
      this.physicsHeight,
      {
        isStatic: true,
        render: {
          fillStyle: 'transparent',
          strokeStyle: 'white',
          lineWidth: 1
        }
      }
    );
    
    // Add walls to the world (including ground)
    Composite.add(this.engine.world, [ground, leftWall, rightWall]);
  }

  setupEventListeners() {
    // Handle key down events
    document.addEventListener('keydown', (event) => {
      const key = event.key.toLowerCase();
      
      // Only process specific keys: a, s, d, f, g, h, j, k
      const allowedKeys = ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k'];
      if (!allowedKeys.includes(key)) return;
      
      // Prevent default browser behavior for these keys
      event.preventDefault();
      
      // Skip if already processing this key
      if (this.keysPressed[key]) return;
      
      // Mark key as pressed
      this.keysPressed[key] = true;
      
      // All keys start with triangles (3 sides)
      const sides = 3;
      
      // Add a growing polygon for physics
      this.addGrowingPolygon(sides, key);
      
      // Also place a note on the staff for all valid keys
      if (key in this.staffManager.keyNotes) {
        this.staffManager.placeNoteOnStaff(key, this.audioManager);
        this.bodyCount++;
      }
    });
    
    // Handle key up events
    document.addEventListener('keyup', (event) => {
      const key = event.key.toLowerCase();
      
      // Only process specific keys: a, s, d, f, g, h, j, k
      const allowedKeys = ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k'];
      if (!allowedKeys.includes(key)) return;
      
      // Prevent default browser behavior for these keys
      event.preventDefault();
      
      // Skip if we weren't tracking this key
      if (!this.keysPressed[key]) return;
      
      // Release the polygon
      this.releasePolygon(key);
      
      // Mark key as released
      delete this.keysPressed[key];
    });
  }

  createPolygonVertices(sides, radius) {
    const vertices = [];
    const angle = (2 * Math.PI) / sides;
    
    for (let i = 0; i < sides; i++) {
      const theta = angle * i;
      vertices.push({
        x: radius * Math.cos(theta),
        y: radius * Math.sin(theta)
      });
    }
    
    return vertices;
  }

  addGrowingPolygon(sides, key) {
    const { Bodies, Composite } = this.Matter;
    
    // Initial size
    const initialSize = 5;
    
    // Determine spawn position based on current body count
    let xPos, yPos;
    
    if (this.bodyCount % 3 === 0) {
      // Spawn from top
      xPos = this.boundaryOffsetX + Math.random() * this.physicsWidth;
      yPos = this.boundaryOffsetY + 50;
    } else if (this.bodyCount % 3 === 1) {
      // Spawn from right side
      xPos = this.boundaryOffsetX + this.physicsWidth - 50;
      yPos = this.boundaryOffsetY + Math.random() * (this.physicsHeight / 2);
    } else {
      // Spawn from left side
      xPos = this.boundaryOffsetX + 50;
      yPos = this.boundaryOffsetY + Math.random() * (this.physicsHeight / 2);
    }
    
    // Get the number of sides from the key mapping
    const polygonSides = key in PhysicsPolygons.keySides ? PhysicsPolygons.keySides[key] : 3;
    
    // Create initial polygon vertices
    const vertices = this.createPolygonVertices(polygonSides, initialSize);
    
    // Create static polygon body that won't move
    const polygon = Bodies.fromVertices(xPos, yPos, [vertices], {
      isStatic: true,
      render: {
        fillStyle: 'transparent',
        strokeStyle: 'white',
        lineWidth: 1
      }
    });
    
    // Add to world
    Composite.add(this.engine.world, polygon);
    this.bodyCount++;
    
    // Store the growing polygon info
    this.growingPolygons[key] = {
      body: polygon,
      sides: polygonSides,
      size: initialSize,
      x: xPos,
      y: yPos,
      growRate: 0.5, // Size increase per frame
      startTime: Date.now() // Track when we started growing
    };
    
    // Play initial sound
    this.audioManager.playTone(polygonSides, 0.5);
    
    return polygon;
  }

  growPolygon(key) {
    const { Composite, Bodies } = this.Matter;
    
    if (!this.growingPolygons[key]) return;
    
    const info = this.growingPolygons[key];
    info.size += info.growRate;
    
    // Remove the old body
    Composite.remove(this.engine.world, info.body);
    
    // Create new vertices with increased size but keeping the same sides count
    const newVertices = this.createPolygonVertices(info.sides, info.size);
    
    // Create new body with updated size
    const newBody = Bodies.fromVertices(info.x, info.y, [newVertices], {
      isStatic: true,
      render: {
        fillStyle: 'transparent',
        strokeStyle: 'white',
        lineWidth: 1,
        smoothShading: true
      }
    });
    
    // Update the stored body
    info.body = newBody;
    
    // Add the new body to the world
    Composite.add(this.engine.world, newBody);
    
    // Play tone with frequency based on size
    if (Math.floor(info.size) % 10 === 0) {
      this.audioManager.playTone(info.sides, Math.min(info.size / 100, 1));
    }
  }

  releasePolygon(key) {
    const { Composite, Bodies, Body, Common } = this.Matter;
    
    if (!this.growingPolygons[key]) return;
    
    const info = this.growingPolygons[key];
    
    // Remove the static body
    Composite.remove(this.engine.world, info.body);
    
    // Create new vertices with final size
    const finalVertices = this.createPolygonVertices(info.sides, info.size);
    
    // Create a new body with physics enabled
    const newBody = Bodies.fromVertices(info.x, info.y, [finalVertices], {
      isStatic: false,
      frictionAir: 0.02,
      restitution: 0.3,
      friction: 0.1,
      render: {
        fillStyle: 'transparent',
        strokeStyle: 'white',
        lineWidth: 1,
        smoothShading: true
      }
    });
    
    // Add random rotation
    Body.setAngularVelocity(newBody, Common.random(-0.05, 0.05));
    
    // Add the new body to the world
    Composite.add(this.engine.world, newBody);
    
    // Clean up tracking
    delete this.growingPolygons[key];
    
    // Play final release sound
    this.audioManager.playSound(info.sides);
  }

  update() {
    // Grow all active polygons
    for (const key in this.growingPolygons) {
      this.growPolygon(key);
    }
    
    requestAnimationFrame(() => this.update());
  }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('canvas-container');
  const containerWidth = container.clientWidth;
  const containerHeight = container.clientHeight;
  
  // Create the main application instance with fixed physics boundaries
  const physicsWidth = 800;
  const physicsHeight = 500;
  
  // Override the createBoundaries method BEFORE creating the instance
  PhysicsPolygons.prototype.createBoundaries = function() {
    const { Bodies, Composite } = this.Matter;
    
    // Calculate position to center the boundaries in the larger canvas
    const offsetX = (containerWidth - physicsWidth) / 2;
    const offsetY = (containerHeight - physicsHeight) / 2;
    
    // Store these offsets for use in other methods
    this.boundaryOffsetX = offsetX;
    this.boundaryOffsetY = offsetY;
    this.physicsWidth = physicsWidth;
    this.physicsHeight = physicsHeight;
    
    // Create ground (bottom wall) - extended 15px on each side
    const groundWidth = physicsWidth + 25; // Add 30px (15px on each side)
    const ground = Bodies.rectangle(
      physicsWidth / 2 + offsetX, // Keep the center position the same
      physicsHeight + offsetY -12, 
      groundWidth, 
      25,
      {
        isStatic: true,
        render: {
          fillStyle: 'transparent',
          strokeStyle: 'white',
          lineWidth: 1
        },
        collisionFilter: {
          group: 1
        }
      }
    );
    
    // Create left wall - reduced thickness from 50 to 25
    const leftWall = Bodies.rectangle(
      offsetX,
      physicsHeight / 2 + offsetY,
      25,
      physicsHeight,
      {
        isStatic: true,
        render: {
          fillStyle: 'transparent',
          strokeStyle: 'white',
          lineWidth: 1
        }
      }
    );
    
    // Create right wall - reduced thickness from 50 to 25
    const rightWall = Bodies.rectangle(
      physicsWidth + offsetX,
      physicsHeight / 2 + offsetY,
      25,
      physicsHeight,
      {
        isStatic: true,
        render: {
          fillStyle: 'transparent',
          strokeStyle: 'white',
          lineWidth: 1
        }
      }
    );
    
    // Add walls to the world (including ground)
    Composite.add(this.engine.world, [ground, leftWall, rightWall]);
  };
  
  // Now create the instance after overriding the method
  const polygons = new PhysicsPolygons(containerWidth, containerHeight);
  
  // Override addGrowingPolygon after instance creation
  polygons.addGrowingPolygon = function(sides, key) {
    const { Bodies, Composite } = this.Matter;
    
    // Initial size
    const initialSize = 5;
    
    // Determine spawn position based on current body count
    let xPos, yPos;
    
    if (this.bodyCount % 3 === 0) {
      // Spawn from top
      xPos = this.boundaryOffsetX + Math.random() * this.physicsWidth;
      yPos = this.boundaryOffsetY + 50;
    } else if (this.bodyCount % 3 === 1) {
      // Spawn from right side
      xPos = this.boundaryOffsetX + this.physicsWidth - 50;
      yPos = this.boundaryOffsetY + Math.random() * (this.physicsHeight / 2);
    } else {
      // Spawn from left side
      xPos = this.boundaryOffsetX + 50;
      yPos = this.boundaryOffsetY + Math.random() * (this.physicsHeight / 2);
    }
    
    // Get the number of sides from the key mapping
    const polygonSides = key in PhysicsPolygons.keySides ? PhysicsPolygons.keySides[key] : 3;
    
    // Create initial polygon vertices
    const vertices = this.createPolygonVertices(polygonSides, initialSize);
    
    // Create static polygon body that won't move
    const polygon = Bodies.fromVertices(xPos, yPos, [vertices], {
      isStatic: true,
      render: {
        fillStyle: 'transparent',
        strokeStyle: 'white',
        lineWidth: 1
      }
    });
    
    // Add to world
    Composite.add(this.engine.world, polygon);
    this.bodyCount++;
    
    // Store the growing polygon info
    this.growingPolygons[key] = {
      body: polygon,
      sides: polygonSides,
      size: initialSize,
      x: xPos,
      y: yPos,
      growRate: 0.5, // Size increase per frame
      startTime: Date.now() // Track when we started growing
    };
    
    // Play initial sound
    this.audioManager.playTone(polygonSides, 0.5);
    
    return polygon;
  };
}); 