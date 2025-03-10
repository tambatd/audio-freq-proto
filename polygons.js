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
    
    // Map keys to notes (A-K)
    this.keyNotes = {
      'a': 0, // E
      's': 1, // F
      'd': 2, // G
      'f': 3, // A
      'g': 4, // B
      'h': 5, // C
      'j': 6, // D
      'k': 7  // E (higher)
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

  // Static properties
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
    
    // Create ground (bottom wall)
    const ground = Bodies.rectangle(
      this.containerWidth / 2, 
      this.containerHeight, 
      this.containerWidth, 
      50, 
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
    
    // Create left wall
    const leftWall = Bodies.rectangle(
      0,
      this.containerHeight / 2,
      50,
      this.containerHeight,
      {
        isStatic: true,
        render: {
          fillStyle: 'transparent',
          strokeStyle: 'white',
          lineWidth: 1
        }
      }
    );
    
    // Create right wall
    const rightWall = Bodies.rectangle(
      this.containerWidth,
      this.containerHeight / 2,
      50,
      this.containerHeight,
      {
        isStatic: true,
        render: {
          fillStyle: 'transparent',
          strokeStyle: 'white',
          lineWidth: 1
        }
      }
    );
    
    // Add walls to the world
    Composite.add(this.engine.world, [ground, leftWall, rightWall]);
  }

  setupEventListeners() {
    // Handle key down events
    document.addEventListener('keydown', (event) => {
      const key = event.key.toLowerCase();
      
      // Skip if already processing this key
      if (this.keysPressed[key]) return;
      
      // Mark key as pressed
      this.keysPressed[key] = true;
      
      let sides;
      if (key in PhysicsPolygons.keySides) {
        // If it's one of our mapped keys, use the predefined number of sides
        sides = PhysicsPolygons.keySides[key];
      } else {
        // For any other key, generate a random number of sides between 3 and 10
        sides = Math.floor(Math.random() * 8) + 3;
      }
      
      // Add a growing polygon for physics
      this.addGrowingPolygon(sides, key);
      
      // Also place a note on the staff for all keys except spacebar
      if (key !== ' ' && key in this.staffManager.keyNotes) {
        this.staffManager.placeNoteOnStaff(key, this.audioManager);
        this.bodyCount++;
      }
    });
    
    // Handle key up events
    document.addEventListener('keyup', (event) => {
      const key = event.key.toLowerCase();
      
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
    
    // Calculate 25% inward for the walls
    const inset = this.containerWidth * 0.25;
    
    // Initial size
    const initialSize = 5;
    
    // Random x position (keeping within the walls)
    const minX = inset + 50;
    const maxX = this.containerWidth - inset - 50;
    const xPos = minX + Math.random() * (maxX - minX);
    
    // Random y position (in top half of screen)
    const yPos = 50 + Math.random() * (this.containerHeight / 2);
    
    // Create initial polygon vertices
    const vertices = this.createPolygonVertices(sides, initialSize);
    
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
      sides: sides,
      size: initialSize,
      x: xPos,
      y: yPos,
      growRate: 0.5 // Size increase per frame
    };
    
    // Play initial sound
    this.audioManager.playTone(sides, 0.5);
    
    return polygon;
  }

  growPolygon(key) {
    const { Composite, Bodies } = this.Matter;
    
    if (!this.growingPolygons[key]) return;
    
    const info = this.growingPolygons[key];
    info.size += info.growRate;
    
    // Remove the old body
    Composite.remove(this.engine.world, info.body);
    
    // Create new vertices with increased size
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
  
  // Create the main application instance
  new PhysicsPolygons(containerWidth, containerHeight);
}); 