import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useGameLoop } from '../hooks/useGameLoop';
import { useKeyPress } from '../hooks/useKeyPress';

interface GameObject {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
}

interface Projectile extends GameObject {
  active: boolean;
  id: string;
}

interface Enemy extends GameObject {
  active: boolean;
  id: string;
}

export function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [highScore, setHighScore] = useState(0);
  const [isTouchLeft, setIsTouchLeft] = useState(false);
  const [isTouchRight, setIsTouchRight] = useState(false);
  const [isTouchShoot, setIsTouchShoot] = useState(false);

  const [player, setPlayer] = useState<GameObject>({
    x: 400,
    y: 500,
    width: 40,
    height: 40,
    speed: 8,
  });

  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const lastShootTime = useRef(0);

  const leftPressed = useKeyPress('ArrowLeft') || isTouchLeft;
  const rightPressed = useKeyPress('ArrowRight') || isTouchRight;
  const spacePressed = useKeyPress(' ') || isTouchShoot;

  const initializeGame = useCallback(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      setPlayer(prev => ({
        ...prev,
        x: canvas.width / 2 - 20,
        y: canvas.height - 60,
      }));
    }
  }, []);

  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  const spawnEnemy = useCallback(() => {
    if (canvasRef.current && Math.random() < 0.02) {
      const canvas = canvasRef.current;
      const enemy: Enemy = {
        x: Math.random() * (canvas.width - 30),
        y: -30,
        width: 30,
        height: 30,
        speed: 2 + Math.random() * 2,
        active: true,
        id: crypto.randomUUID(),
      };
      setEnemies(prev => [...prev, enemy]);
    }
  }, []);

  const shoot = useCallback(() => {
    const now = Date.now();
    if (spacePressed && now - lastShootTime.current > 250) {
      lastShootTime.current = now;
      const projectile: Projectile = {
        x: player.x + player.width / 2 - 2,
        y: player.y,
        width: 4,
        height: 10,
        speed: 10,
        active: true,
        id: crypto.randomUUID(),
      };
      setProjectiles(prev => [...prev, projectile]);
    }
  }, [spacePressed, player.x, player.y, player.width]);

  const checkCollision = (obj1: GameObject, obj2: GameObject) => {
    return (
      obj1.x < obj2.x + obj2.width &&
      obj1.x + obj1.width > obj2.x &&
      obj1.y < obj2.y + obj2.height &&
      obj1.y + obj1.height > obj2.y
    );
  };

  const handleCollisions = useCallback(() => {
    let scoreIncrease = 0;
    let shouldGameOver = false;

    const projectilesToRemove = new Set<string>();
    const enemiesToRemove = new Set<string>();

    enemies.forEach(enemy => {
      if (!enemy.active) return;

      if (checkCollision(player, enemy)) {
        shouldGameOver = true;
        return;
      }

      projectiles.forEach(projectile => {
        if (
          projectile.active &&
          !projectilesToRemove.has(projectile.id) &&
          !enemiesToRemove.has(enemy.id) &&
          checkCollision(projectile, enemy)
        ) {
          projectilesToRemove.add(projectile.id);
          enemiesToRemove.add(enemy.id);
          scoreIncrease += 100;
        }
      });
    });

    if (projectilesToRemove.size > 0 || enemiesToRemove.size > 0) {
      setProjectiles(prev =>
        prev.map(p =>
          projectilesToRemove.has(p.id) ? { ...p, active: false } : p
        )
      );

      setEnemies(prev =>
        prev.map(e =>
          enemiesToRemove.has(e.id) ? { ...e, active: false } : e
        )
      );

      setScore(prev => prev + scoreIncrease);
    }

    if (shouldGameOver) {
      setGameOver(true);
      setHighScore(prev => Math.max(prev, score));
    }
  }, [enemies, projectiles, player, score]);

  const updateGame = useCallback(() => {
    if (gameOver) return;

    if (leftPressed || rightPressed) {
      setPlayer(prev => ({
        ...prev,
        x: Math.max(
          0,
          Math.min(
            (canvasRef.current?.width || 800) - prev.width,
            prev.x + (leftPressed ? -prev.speed : prev.speed)
          )
        ),
      }));
    }

    setProjectiles(prev =>
      prev
        .filter(p => p.active)
        .map(projectile => ({
          ...projectile,
          y: projectile.y - projectile.speed,
          active: projectile.y > -projectile.height,
        }))
    );

    setEnemies(prev =>
      prev
        .filter(e => e.active)
        .map(enemy => ({
          ...enemy,
          y: enemy.y + enemy.speed,
          active: enemy.y < (canvasRef.current?.height || 600),
        }))
    );

    handleCollisions();
    spawnEnemy();
    shoot();
  }, [gameOver, leftPressed, rightPressed, handleCollisions, spawnEnemy, shoot]);

  useGameLoop(updateGame, 60);

  const drawShip = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) => {
    ctx.beginPath();
    ctx.moveTo(x + width / 2, y);
    ctx.lineTo(x + width, y + height);
    ctx.lineTo(x, y + height);
    ctx.closePath();
    ctx.fill();
  };

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * canvas.width;
      const y = (Date.now() / 20 + i * 30) % canvas.height;
      ctx.fillRect(x, y, 1, 1);
    }

    ctx.fillStyle = '#60A5FA';
    drawShip(ctx, player.x, player.y, player.width, player.height);

    ctx.fillStyle = '#34D399';
    projectiles.forEach(projectile => {
      if (projectile.active) {
        ctx.fillRect(
          projectile.x,
          projectile.y,
          projectile.width,
          projectile.height
        );
      }
    });

    ctx.fillStyle = '#F87171';
    enemies.forEach(enemy => {
      if (enemy.active) {
        drawShip(ctx, enemy.x, enemy.y, enemy.width, enemy.height);
      }
    });

    requestAnimationFrame(draw);
  }, [player.x, player.y, projectiles, enemies]);

  useEffect(() => {
    draw();
  }, [draw]);

  const resetGame = () => {
    setGameOver(false);
    setScore(0);
    setEnemies([]);
    setProjectiles([]);
    initializeGame();
  };

  return (
    <div className="w-full min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
      <div className="relative">
        <div className="absolute top-4 left-4 text-white text-xl font-bold z-10">
          Score: {score}
        </div>
        <div className="absolute top-4 right-4 text-white text-xl font-bold z-10">
          High Score: {highScore}
        </div>
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="bg-gray-800 rounded-lg shadow-2xl border-2 border-gray-700"
        />
        {gameOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 rounded-lg">
            <div className="text-center p-8 bg-gray-800 rounded-lg shadow-2xl border-2 border-gray-700">
              <h2 className="text-4xl font-bold text-white mb-4">Game Over!</h2>
              <p className="text-xl text-white mb-6">Final Score: {score}</p>
              <button
                onClick={resetGame}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50"
              >
                Play Again
              </button>
            </div>
          </div>
        )}
      </div>
      <div className="mt-6 text-gray-400 text-center">
        <p className="mb-4">Use ← → arrows to move • Space to shoot</p>
        <div className="fixed bottom-4 left-0 right-0 flex justify-between px-4 md:hidden">
          <div className="flex gap-4">
            <button
              onTouchStart={() => setIsTouchLeft(true)}
              onTouchEnd={() => setIsTouchLeft(false)}
              className="w-16 h-16 bg-blue-500 rounded-full opacity-50 active:opacity-75 flex items-center justify-center text-white text-2xl"
            >
              ←
            </button>
            <button
              onTouchStart={() => setIsTouchRight(true)}
              onTouchEnd={() => setIsTouchRight(false)}
              className="w-16 h-16 bg-blue-500 rounded-full opacity-50 active:opacity-75 flex items-center justify-center text-white text-2xl"
            >
              →
            </button>
          </div>
          <button
            onTouchStart={() => setIsTouchShoot(true)}
            onTouchEnd={() => setIsTouchShoot(false)}
            className="w-16 h-16 bg-red-500 rounded-full opacity-50 active:opacity-75 flex items-center justify-center text-white text-sm font-bold"
          >
            FIRE
          </button>
        </div>
      </div>
    </div>
  );
}