import kaplay from "kaplay";
import { makeBackground } from "./utils";
import { SCALE_FACTOR } from "./constants";
import { makePlayer } from "./player";
import { saveSystem } from "./save";
import { makeScoreBox } from "./scoreBox";

//import { appWindow } from "@tauri-apps/api/window"

const k = kaplay({
  width: 1280, //Définit la largeur de la fenêtre ou de la zone de jeu en pixels.
  height: 720, //Définit la hauteur de la fenêtre ou de la zone de jeu en pixels
  letterbox: true,//Cela garantit que le contenu du jeu ne sera pas déformé sur des écrans ayant des dimensions différentes.
  global: false, //Toutes les fonctionnalités de Kaplay doivent être appelées à partir de l'instance k.
  scale: 2, //Définit un facteur d'échelle pour le rendu graphique.
});

//Un sprite est une image 2D ou une animation utilisée dans les jeux pour représenter des objets, des personnages ou des éléments d'arrière-plan.

//loadSprite charge une image dans la mémoire du moteur de jeu et l'associe à un identifiant unique que tu pourras utiliser plus tard pour afficher ou manipuler cet élément graphique.
k.loadSprite("kriby","./kriby.png");
k.loadSprite("obstacles","./obstacles.png");
k.loadSprite("background","./background.png");
k.loadSprite("clouds","./clouds.png");

k.loadSound("jump", "./jump.wav");
k.loadSound("hurt", "./hurt.wav");
k.loadSound("confirm", "./confirm.wav");
/*
addEventListener("keydown", async (key) => {
  if(key.code === "F11") {
    if(await appWindow.isFullscreen()) {
      await appWindow.setFullscreen(false);
      return;
    }


    appWindow.setFullscreen(true);
  }
})
  */

k.scene("start", async () => {
  makeBackground(k);

  const map = k.add([
    k.sprite("background"),
    k.pos(0,0),
    k.scale(SCALE_FACTOR),
  ]);

  const clouds = map.add([
    k.sprite("clouds"),
    k.pos(),
    {
        speed: 5,
    },
  ]);


  clouds.onUpdate(() => {
    clouds.move(clouds.speed, 0);
    if(clouds.pos.x > 700) {
      clouds.pos.x = -500;
    }
    
  });

  map.add([k.sprite("obstacles"), k.pos()]);

  const player = k.add(makePlayer(k));
  player.pos = k.vec2(k.center().x - 350, k.center().y + 56);

  const playBtn = k.add([
    k.rect(200, 50, {radius: 3}),
    k.color(k.Color.fromHex("#14638e")),
    k.area(),
    k.anchor("center"),
    k.pos(k.center().x + 30, k.center().y + 60),
  ]);

  playBtn.add([
    k.text("Play", {size: 24}),
    k.color(k.Color.fromHex("#d7f2f7")),
    k.area(),
    k.anchor("center"),
  ]);

  const gotoGame = () => {
    k.play("confirm");
    k.go("main");
  };

  playBtn.onClick(gotoGame);

  k.onKeyPress("space", gotoGame);

  k.onGamepadButtonPress("south", gotoGame);

  await saveSystem.load();
    if(!saveSystem.data.maxScore) {
      saveSystem.data.maxScore = 0;
      await saveSystem.save();
    }
});

k.scene("main", async () => {

  makeBackground(k);


  let score = 0;

  const colliders = await (await fetch("./collidersData.json")).json()
  const collidersData = colliders.data;


  k.setGravity(2500);

  const map = k.add([k.pos(0, -50), k.scale(SCALE_FACTOR)]);

  map.add([k.sprite("background"), k.pos()]);

  const clouds = map.add([k.sprite("clouds"), k.pos(), { speed: 5 }]);
  clouds.onUpdate(() => {
    clouds.move(clouds.speed, 0);
    if (clouds.pos.x > 700) {
      clouds.pos.x = -500; // put the clouds far back so it scrolls again through the level
    }
  });
  
  const platforms = map.add([
    k.sprite("obstacles"),
    k.pos(),
    k.area(),
    { speed: 100 },
  ]);

  platforms.onUpdate(() => {
    platforms.move(-platforms.speed, 0);
    if (platforms.pos.x < -490) {
      platforms.pos.x = 300; // put the platforms far back so it scrolls again through the level
      platforms.speed += 30; // progressively increase speed
    }
  });

  
  k.loop(1, () => {
    score += 1;
  });

  for (const collider of collidersData) {
    platforms.add([
      k.area({
        shape: new k.Rect(k.vec2(0), collider.width, collider.height),
      }),
      k.body({ isStatic: true }),
      k.pos(collider.x, collider.y),
      "obstacle",
    ]);
  }

  k.add([k.rect(k.width(), 50), k.pos(0, -100), k.area(), "obstacle"]);

  k.add([k.rect(k.width(), 50), k.pos(0, 1000), k.area(), "obstacle"]);

  const player = k.add(makePlayer(k));
  player.pos = k.vec2(600, 250);
  player.setControls();
  player.onCollide("obstacle", async () => {
    if (player.isDead) return;
    k.play("hurt");
    platforms.speed = 0;
    player.disableControls();
    k.add(await makeScoreBox(k, k.center(), score));
    player.isDead = true;
  });

  k.camScale(k.vec2(1.2));
  player.onUpdate(() => {
    k.camPos(player.pos.x, 400);
  });




});

k.go("start");

