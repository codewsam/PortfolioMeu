/* ==========================================================================
   SPACE INVADERS ARCADE ENGINE - COMPACT RETRO EDITION
   ========================================================================== */

(function initSpaceInvaders() {
  const canvas = document.getElementById('spaceInvadersCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const SQUID_1 = [
    [0,0,0,1,1,0,0,0],
    [0,0,1,1,1,1,0,0],
    [0,1,1,1,1,1,1,0],
    [1,1,0,1,1,0,1,1],
    [1,1,1,1,1,1,1,1],
    [0,0,1,0,0,1,0,0],
    [0,1,0,1,1,0,1,0],
    [1,0,1,0,0,1,0,1]
  ];
  const SQUID_2 = [
    [0,0,0,1,1,0,0,0],
    [0,0,1,1,1,1,0,0],
    [0,1,1,1,1,1,1,0],
    [1,1,0,1,1,0,1,1],
    [1,1,1,1,1,1,1,1],
    [0,1,0,1,1,0,1,0],
    [1,0,0,0,0,0,0,1],
    [0,1,0,0,0,0,1,0]
  ];

  const CRAB_1 = [
    [0,0,1,0,0,0,0,0,1,0,0],
    [0,0,0,1,0,0,0,1,0,0,0],
    [0,0,1,1,1,1,1,1,1,0,0],
    [0,1,1,0,1,1,1,0,1,1,0],
    [1,1,1,1,1,1,1,1,1,1,1],
    [1,0,1,1,1,1,1,1,1,0,1],
    [1,0,1,0,0,0,0,0,1,0,1],
    [0,0,0,1,1,0,1,1,0,0,0]
  ];
  const CRAB_2 = [
    [0,0,1,0,0,0,0,0,1,0,0],
    [1,0,0,1,0,0,0,1,0,0,1],
    [1,0,1,1,1,1,1,1,1,0,1],
    [1,1,1,0,1,1,1,0,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1],
    [0,0,1,1,1,1,1,1,1,0,0],
    [0,0,1,0,0,0,0,0,1,0,0],
    [0,1,0,0,0,0,0,0,0,1,0]
  ];

  const CANNON = [
    [0,0,0,0,0,0,1,0,0,0,0,0,0],
    [0,0,0,0,0,1,1,1,0,0,0,0,0],
    [0,0,0,0,0,1,1,1,0,0,0,0,0],
    [0,1,1,1,1,1,1,1,1,1,1,1,0],
    [1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1]
  ];

  let width = 0;
  let height = 0;
  let pixelSize = 1.8;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    if (width === 0 || height === 0) return;
    canvas.width = width * (window.devicePixelRatio || 1);
    canvas.height = height * (window.devicePixelRatio || 1);
    ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
    ctx.imageSmoothingEnabled = false;
    pixelSize = width < 480 ? 1.6 : 2.0;
    initInvaders();
  }

  window.addEventListener('resize', resize);

  // Stars
  const stars = [];
  for (let i = 0; i < 30; i++) {
    stars.push({
      x: Math.random() * 800,
      y: Math.random() * 200,
      size: Math.random() > 0.8 ? 2 : 1,
      speed: 0.2 + Math.random() * 0.4
    });
  }

  // Invaders setup
  let invaders = [];
  let invaderDir = 1;
  let invaderStepTimer = 0;
  let invaderAnimFrame = 0;

  function initInvaders() {
    invaders = [];
    const colSpacing = width < 480 ? 30 : 38;
    const cols = Math.min(8, Math.max(4, Math.floor((width - 40) / colSpacing)));
    const startX = Math.max(16, (width - (cols * colSpacing)) / 2);
    const startY = 12;

    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < cols; c++) {
        invaders.push({
          x: startX + c * colSpacing,
          y: startY + r * 20,
          row: r,
          alive: true,
          type: r === 0 ? 'squid' : 'crab',
          color: r === 0 ? '#FEF1CF' : '#ffffff'
        });
      }
    }
  }

  // Player cannon
  const player = {
    x: 100,
    y: 70,
    targetX: 100,
    autoDir: 1
  };

  let bullets = [];
  let particles = [];
  let shootTimer = 0;

  function drawSprite(matrix, posX, posY, scale, color) {
    ctx.fillStyle = color;
    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix[r].length; c++) {
        if (matrix[r][c] === 1) {
          ctx.fillRect(
            Math.round(posX + c * scale),
            Math.round(posY + r * scale),
            Math.ceil(scale),
            Math.ceil(scale)
          );
        }
      }
    }
  }

  function spawnExplosion(x, y, color) {
    for (let i = 0; i < 10; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 2;
      particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        color: color
      });
    }
  }

  function shootBullet(bx, by) {
    bullets.push({ x: bx, y: by, vy: -4.5 });
  }

  // Touch and Mouse interactive support
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    player.targetX = e.clientX - rect.left;
  });

  canvas.addEventListener('click', (e) => {
    shootBullet(player.x, player.y - 6);
  });

  canvas.addEventListener('touchmove', (e) => {
    if (e.touches.length > 0) {
      const rect = canvas.getBoundingClientRect();
      player.targetX = e.touches[0].clientX - rect.left;
    }
  }, { passive: true });

  canvas.addEventListener('touchstart', (e) => {
    if (e.touches.length > 0) {
      const rect = canvas.getBoundingClientRect();
      player.targetX = e.touches[0].clientX - rect.left;
      shootBullet(player.x, player.y - 6);
    }
  }, { passive: true });

  // Controles Físicos do Game Boy Handheld
  const btnLeft = document.getElementById('btnDpadLeft');
  const btnRight = document.getElementById('btnDpadRight');
  const btnA = document.getElementById('btnActionA');
  const btnB = document.getElementById('btnActionB');
  const btnStart = document.getElementById('btnStart');
  const btnSelect = document.getElementById('btnSelect');

  const bindTouchOrClick = (el, fn) => {
    if (!el) return;
    let touched = false;
    el.addEventListener('touchstart', (e) => {
      e.preventDefault();
      touched = true;
      fn(e);
      setTimeout(() => { touched = false; }, 350);
    }, { passive: false });
    el.addEventListener('click', (e) => {
      if (touched) return;
      e.preventDefault();
      fn(e);
    });
  };

  bindTouchOrClick(btnLeft, () => {
    player.targetX = Math.max(30, player.targetX - 45);
  });

  bindTouchOrClick(btnRight, () => {
    player.targetX = Math.min(width - 30, player.targetX + 45);
  });

  bindTouchOrClick(btnA, () => {
    shootBullet(player.x, player.y - 6);
  });

  bindTouchOrClick(btnB, () => {
    shootBullet(player.x - 8, player.y - 6);
    shootBullet(player.x + 8, player.y - 6);
  });

  [btnStart, btnSelect].forEach((b) => {
    bindTouchOrClick(b, () => {
      shootBullet(player.x - 12, player.y - 6);
      shootBullet(player.x, player.y - 8);
      shootBullet(player.x + 12, player.y - 6);
    });
  });

  resize();

  function loop() {
    if (width === 0 || height === 0) {
      resize();
    }

    ctx.clearRect(0, 0, width, height);

    // Starfield
    ctx.fillStyle = 'rgba(254, 241, 207, 0.45)';
    for (let s of stars) {
      s.y += s.speed;
      if (s.y > height) s.y = 0;
      ctx.fillRect(s.x % width, s.y, s.size, s.size);
    }

    // Auto-patrol
    player.targetX += player.autoDir * 0.9;
    if (player.targetX > width - 30) player.autoDir = -1;
    if (player.targetX < 30) player.autoDir = 1;

    player.x += (player.targetX - player.x) * 0.12;
    player.y = height - 16;

    // Draw cannon
    drawSprite(CANNON, player.x - 10, player.y, pixelSize, '#0032A8');

    // Auto-fire
    shootTimer++;
    if (shootTimer > 40) {
      shootTimer = 0;
      shootBullet(player.x + 2, player.y - 4);
    }

    // Draw bullets
    ctx.fillStyle = '#FEF1CF';
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      b.y += b.vy;
      ctx.fillRect(b.x, b.y, 2.5, 6);

      let hit = false;
      for (let inv of invaders) {
        if (!inv.alive) continue;
        const invW = inv.type === 'squid' ? 16 : 22;
        if (b.x >= inv.x && b.x <= inv.x + invW && b.y >= inv.y && b.y <= inv.y + 16) {
          inv.alive = false;
          hit = true;
          spawnExplosion(inv.x + invW / 2, inv.y + 8, inv.color);
          break;
        }
      }

      if (hit || b.y < 0) {
        bullets.splice(i, 1);
      }
    }

    // Invaders movement
    invaderStepTimer++;
    if (invaderStepTimer > 24) {
      invaderStepTimer = 0;
      invaderAnimFrame = 1 - invaderAnimFrame;

      let edgeHit = false;
      for (let inv of invaders) {
        if (!inv.alive) continue;
        if ((inv.x + invaderDir * 6 > width - 26) || (inv.x + invaderDir * 6 < 10)) {
          edgeHit = true;
          break;
        }
      }

      if (edgeHit) {
        invaderDir = -invaderDir;
        for (let inv of invaders) {
          inv.y += 4;
          if (inv.y > height - 26) inv.y = 12;
        }
      } else {
        for (let inv of invaders) {
          inv.x += invaderDir * 5;
        }
      }
    }

    // Draw invaders
    let aliveCount = 0;
    for (let inv of invaders) {
      if (!inv.alive) continue;
      aliveCount++;
      const sprite = inv.type === 'squid'
        ? (invaderAnimFrame === 0 ? SQUID_1 : SQUID_2)
        : (invaderAnimFrame === 0 ? CRAB_1 : CRAB_2);
      drawSprite(sprite, inv.x, inv.y, pixelSize, inv.color);
    }

    if (aliveCount === 0) {
      initInvaders();
    }

    // Particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.04;
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillRect(p.x, p.y, 2.5, 2.5);
      ctx.globalAlpha = 1;
      if (p.life <= 0) particles.splice(i, 1);
    }

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
