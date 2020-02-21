let type = "WebGL"
    if(!PIXI.utils.isWebGLSupported()){
      type = "canvas"
    }

    PIXI.utils.sayHello(type)

  //Aliases
  let Loader = PIXI.Loader;
  let Sprite = PIXI.Sprite;
  let Application = PIXI.Application;
  let Texture = PIXI.Texture;


  //Create a Pixi Application
  let app = new Application({
      width: 600,
      height: 1000,
      antialias: true,
      transparent: false,
      resolution: 1
    }
  );
  //Add the canvas that Pixi automatically created for you to the HTML document
  document.body.appendChild(app.view);
  app.view.focus();

  //load spritesheets and run `setup` function
  Loader.shared
    .add("static/images/Spritesheets/playerSprites.json")
    .add("static/images/Spritesheets/playerSprites2.json")
    .add("static/images/Spritesheets/tiles.json")
    .add("static/images/Spritesheets/items.json")
    .add("static/images/Spritesheets/enemies.json")
    .add("static/images/Spritesheets/backgrounds/bgtest.png")
    .add("static/images/Spritesheets/backgrounds/ship.png")
    .add("static/images/Spritesheets/backgrounds/shipIcon.png")
    .load(startScreen);

  //define vars
  let p1, ground, exit, bg, state, p1Textures, enemyTextures, time, numCoinsCollected, coinDisplay, arrowLeft, arrowRight, startGems, shipIcon, shipDisplay;
  let speed = 0;
  const spriteScale = 40;
  const shipHeight = -10000;
  let spriteScaleHeight = spriteScale + (spriteScale*.2);;
  let lifeCount = 3;
  let left, right, up, down;
  let platforms = new Array();
  let coins = new Array();
  let enemies = new Array();
  let lives = new Array();
  let enemiesHit = new Array();


  //handle keyboard input
  function keyboard(value){
    let key = {};
    key.value = value;
    key.isDown = false;
    key.isUp = true;
    key.press = undefined;
    key.release = undefined;

    //The `downHandler`
    key.downHandler = event => {
      if (event.key === key.value) {
        if (key.isUp && key.press) key.press();
        key.isDown = true;
        key.isUp = false;
        event.preventDefault();
      }
    };

    //The `upHandler`
    key.upHandler = event => {
      if (event.key === key.value) {
        if (key.isDown && key.release) key.release();
        key.isDown = false;
        key.isUp = true;
        event.preventDefault();
      }
    };

    //Attach event listeners
    const downListener = key.downHandler.bind(key);
    const upListener = key.upHandler.bind(key);

    key.subscribe = () => {
      window.addEventListener(
        "keydown", downListener, false
      );
      window.addEventListener(
        "keyup", upListener, true
      );
    }



    // Detach event listeners
    key.unsubscribe = () => {
      window.removeEventListener("keydown", downListener);
      window.removeEventListener("keyup", upListener);
    };

    return key;
  }

  //game logic & helper functions
  function testCollision(r1, r2) {
    //Define the variables we'll need to calculate
    let hit, combinedHalfWidths, combinedHalfHeights, vx, vy;

    //hit will determine whether there's a collision
    hit = false;

    //Find the center points of each sprite
    r1.centerX = r1.x + r1.width / 2;
    r1.centerY = r1.y + r1.height / 2;
    r2.centerX = r2.x + r2.width / 2;
    r2.centerY = r2.y + r2.height / 2;

    //Find the half-widths and half-heights of each sprite
    r1.halfWidth = r1.width / 2;
    r1.halfHeight = r1.height / 2;
    r2.halfWidth = r2.width / 2;
    r2.halfHeight = r2.height / 2;

    //Calculate the distance vector between the sprites
    vx = r1.centerX - r2.centerX;
    vy = r1.centerY - r2.centerY;

    //Figure out the combined half-widths and half-heights
    combinedHalfWidths = r1.halfWidth + r2.halfWidth;
    combinedHalfHeights = r1.halfHeight + r2.halfHeight;

    //Check for a collision on the x axis
    if (Math.abs(vx) < combinedHalfWidths) {

      //A collision might be occurring. Check for a collision on the y axis
      if (Math.abs(vy) < combinedHalfHeights) {

        //There's definitely a collision happening
        hit = true;
      } else {

        //There's no collision on the y axis
        hit = false;
      }
    } else {

      //There's no collision on the x axis
      hit = false;
    }

    //`hit` will be either `true` or `false`
    return hit;
  };
  function testLanding(player, surface){
    let playerBottom = player.y + player.height*.5;

    if (testCollision(player, surface)){
      let surfaceTop = surface.y - surface.height*.5;

      if (playerBottom >= surfaceTop && playerBottom <= surfaceTop + (spriteScale*.5)){
        player.vy = 0;
        player.y = surfaceTop - player.height*.5;
        player.jumping = false;
        player.surfaceOn = surface;
        player.texture = p1Textures.stand;
        up.subscribe();
        down.subscribe();
      }
    }

  }
  function generatePlatform(texture){
    //must be called after beginning platform sequence is created (i.e. platforms is not empty)
    let prevPlatform = platforms[platforms.length-1];
    let size = Math.floor(Math.random() *3);
    for (let i=0; i<=size; i++) {
      let platform = new Sprite(texture);
      platform.height = spriteScale * .5;
      platform.width = spriteScale
      if (i == 0) {
        platform.y = prevPlatform.y - spriteScale - Math.random() * spriteScale * 1.8;
        platform.x = Math.random() * (app.screen.width - platform.width - spriteScale*1.5) + spriteScale*.5;//+ spriteScale*.5;
      } else {
        platform.y = platforms[platforms.length - 1].y;
        platform.x = platforms[platforms.length - 1].x + spriteScale;
      }
      platform.vx = 0;
      platform.vy = prevPlatform.vy;
      platforms.push(platform);
      app.stage.addChild(platforms[platforms.length - 1]);
      if (Math.random()*4<1) {
        generateCoin(platform);
      }
    }
  }
  function generateCoin(platform){
    let coin = new Sprite(Texture.from("gemYellow.png"));
    coin.height = coin.width = spriteScale*.7;
    coin.anchor.set(0.5);
    coin.x = platform.x;
    coin.y = platform.y - coin.height;
    coins.push(coin);
    app.stage.addChild(coin);
  }
  function generateEnemy(){
    let enemyMap = ['bee','fly'];
    let enemyNum = Math.floor(Math.random()*2);
    let enemy = new Sprite(enemyTextures[enemyMap[enemyNum]+"FlyTextures"][0]);
    enemy.height = enemy.width = spriteScale*.75;
    enemy.name = enemyMap[enemyNum];
    enemy.x = -spriteScale;
    enemy.y = Math.floor(Math.random()* app.screen.height-spriteScale*2) + spriteScale;
    enemy.vx = 2;
    enemies.push(enemy);
    app.stage.addChild(enemy);
  }
  function enemyHitSequence(){
    let num=0;
    while (num < enemiesHit.length){
      let enemy = enemiesHit[num];
      if (enemy.timeFromHit === 0){
        if (enemy.name == "bee"){
          enemy.texture = enemyTextures.beeHit;
        }
        else enemy.texture = enemyTextures.flyHit;
        enemy.texture.rotate = 12;
      }
      else if (enemy.timeFromHit == 5){
        app.stage.removeChild(enemy);
        enemiesHit.splice(num, 1);
        num--;
      }
      enemy.timeFromHit++
      num++;
    }
  }
  function playerMovementDynamics(){
    //Move player
    p1.x += p1.vx;
    p1.y += p1.vy;


    //screen wrap (player going off right appears on left, vice versa)
    if (p1.x >= app.screen.width){
      p1.x = 0;
    }
    else if (p1.x <= 0){
      p1.x = app.screen.width;
    }

    //jumping
    if (p1.vy !== 0){
      p1.texture = p1Textures.jump;
      if (p1.vx < 0){   //moving left
        p1.texture.rotate = 12;
      }
      else {
        p1.texture.rotate = 0;
      }
    }
    //walking
    else if (p1.vx !== 0){
      let cycle = Math.floor(Date.now()/200) % 2;
      p1.texture = p1Textures.walkTextures[cycle];
      //right
      if (p1.vx > 0){
        p1.texture.rotate = 0;
      }
      //left
      else {
        p1.texture.rotate = 12;
      }
    }
    //handle jump dynamics
    let playerBottom = p1.y + p1.height*.5;
    if (p1.jumping){
      if (p1.y <= p1.jumpHeight){
        if (p1.hangtime === 0){
          p1.jumpHeight = null;
          p1.vy = 16;
        }
        else{
          p1.hangtime -= 1;
          if (p1.hangtime >= 6){
            p1.vy = -1;
          }
          else{
            p1.vy = 1;
          }
        }
      }
      //test for collisions
      else if (playerBottom >= ground.y){
        p1.vy = 0;
        p1.jumping = false;
        p1.surfaceOn = ground;
        p1.y = ground.y - spriteScale*1.1;
        p1.texture = p1Textures.stand;
        up.subscribe();
        down.subscribe();
      }
      else if (p1.vy > 0){
        for (let i in platforms){
          let surface = platforms[i];
          testLanding(p1, surface);
        }
      }
    }

    else if (p1.surfaceOn !== null){
      //player must be on a surface, or just leaving (falling)
      if (p1.surfaceOn != ground) p1.y += speed;
      else if (speed != 0) p1.y += ground.vy;

      if ((playerBottom < ground.y-(30)) && (!testCollision(p1, p1.surfaceOn))){ //player not touching ground, or no longer touching the current surface
        p1.surfaceOn = null;
        p1.jumping = true;
        p1.texture = p1Textures.jump;
        p1.jumpHeight = p1.y;
        down.unsubscribe();
      }
    }

    //check collision and render coins
    for (let i in startGems){
      if (testCollision(p1, startGems[i])){
        app.stage.removeChild(startGems[i]);
        startGems.splice(i, 1);
      }
    }


  }

  //initialize elements shared across interactive screens
  function initializeMainStartElements(){
    //ground
    ground = new PIXI.Container();
    ground.vy = .3;
    for (let i = 0; i < app.screen.width / spriteScale + 1; i++){
      let grass = new Sprite(Texture.from("grassMid.png"));
      let dirt = new Sprite(Texture.from("grassCenter.png"));
      grass.height = grass.width = dirt.height = dirt.width = spriteScale;
      dirt.y = ground.y + spriteScale-1;
      grass.x = dirt.x = i * spriteScale;
      ground.addChild(grass, dirt);
    }
     ground.y = app.screen.height - spriteScale*1.4;
    //direction arrows
    arrowLeft = new Sprite(Texture.from("signLeft.png"))
    arrowRight = new Sprite(Texture.from("signRight.png"))
    arrowLeft.anchor.set(0.5);
    arrowRight.anchor.set(0.5);
    arrowLeft.x = spriteScale;
    arrowRight.x = app.screen.width - spriteScale;
    arrowLeft.y = arrowRight.y = ground.y - spriteScale*1.25;
    arrowLeft.height = arrowLeft.width = arrowRight.height = arrowRight.width = spriteScale * 1.5;
    ground.addChild(arrowLeft, arrowRight);

    bg = new Sprite(Loader.shared.resources["static/images/Spritesheets/backgrounds/bgtest.png"].texture);
    bg.height = app.screen.height;
    bg.width = app.screen.width;

    let p1WalkTextures = [];

    playerNum = "p1";
    let animations = {
        "p1_walk": [playerNum+"_walk1.png", playerNum+"_walk2.png"]
      };

    for (let i=0; i < 2; i++){
      p1WalkTextures[i] = Texture.from(animations.p1_walk[i]);
    }

    p1Textures= {"walkTextures" : p1WalkTextures,
      "duck": Texture.from(playerNum +"_duck.png"),
      "front": Texture.from(playerNum+"_front.png"),
      "hurt": Texture.from(playerNum+"_hurt.png"),
      "jump": Texture.from(playerNum+"_jump.png"),
      "stand": Texture.from(playerNum+"_stand.png")};

    // p1
    p1 = new Sprite(Texture.from(playerNum+"_front.png"));
    p1.anchor.set(0.5);
    p1.height = spriteScaleHeight;
    p1.width = spriteScale;
    p1.y = app.screen.height*.75 - spriteScaleHeight;
    p1.x=app.screen.width*.5;
    p1._zIndex = 100000
    p1.vx = 0;
    p1.vy = 0;
    p1.surfaceOn = ground;
    p1.jumping = false;
    p1.jumpHeight = p1.y;
    p1.hangtime = 0;
    p1.top = p1.y - p1.height*.5;
    p1.bottom = p1.y + p1.height*.5;
    p1.left = p1.x - p1.width*.5;
    p1.right = p1.x + p1.width*.5;

    //listen for keyboard input
    left = keyboard("ArrowLeft"),
    right = keyboard("ArrowRight"),
    up = keyboard("ArrowUp"),
    down = keyboard("ArrowDown");

    //start listening for keyboard input
    left.subscribe();
    right.subscribe();
    down.subscribe();
    up.subscribe();


    //key press and release methods
    // left
    left.press = () => {
      p1.vx = -8;
      p1.height = spriteScaleHeight;
    }
    left.release = () => {
      p1.vx = 0;
      p1.texture = p1Textures.stand;
      p1.texture.rotate = 12;
    }

    //right
    right.press = () => {
      p1.vx = 8;
      p1.height = spriteScaleHeight;
    }
    right.release = () => {
      p1.vx = 0;
      p1.texture = p1Textures.stand;
      p1.texture.rotate = 0;
    }

    //up
    up.press = () => {
      p1.vy = -18;
      p1.jumping = true;
      p1.jumpHeight = p1.y - 4*spriteScale;
      p1.hangtime = 12;
      up.unsubscribe();
      down.unsubscribe();

    }

    //down
    down.press = () => {
      p1.vy = 0;
      p1.vx = 0;
      p1.y = p1.y + spriteScale * .15;
      p1.height = spriteScale * .9;
      p1.texture = p1Textures.duck;
      left.unsubscribe();
      right.unsubscribe();
      up.unsubscribe();
    }
    down.release = () => {
      p1.vy = 0;
      p1.y = p1.y - spriteScale * .15;
      p1.height = spriteScaleHeight;
      p1.texture = p1Textures.front;
      left.subscribe();
      right.subscribe();
      up.subscribe();
    }



  }

  //game scripts
  // initial intro, movement test, & char selection screen
  function startScreen(){
    //character names
    let p1Name = new PIXI.Text("Zemi the Adventurer", {fontFamily: "Odibee Sans", fontSize: 30, fill: 0xe6eefc, align:"center"});
    p1Name.anchor.set(0.5);
    let p2Name = new PIXI.Text("Zoki the Brave", {fontFamily: "Odibee Sans", fontSize: 30, fill: 0xe6eefc, align:"center"});
    p2Name.anchor.set(0.5);
    let p3Name = new PIXI.Text("Zamu the Cunning", {fontFamily: "Odibee Sans", fontSize: 30, fill: 0xe6eefc, align:"center"});
    p3Name.anchor.set(0.5);
    let p4Name = new PIXI.Text("Zorp the Destroyer", {fontFamily: "Odibee Sans", fontSize: 30, fill: 0xe6eefc, align:"center"});
    p4Name.anchor.set(0.5);
    let p5Name = new PIXI.Text("Ziti the Explorer", {fontFamily: "Odibee Sans", fontSize: 30, fill: 0xe6eefc, align:"center"});
    p5Name.anchor.set(0.5);

    //character icons
    let p1Icon = new Sprite(Texture.from("p1_badge1.png"))
    p1Icon.anchor.set(0.5);
    p1Icon.x = p1Name.x = app.screen.width *.5 - spriteScale*4;
    let p2Icon = new Sprite(Texture.from("p2_badge1.png"))
    p2Icon.anchor.set(0.5);
    p2Icon.x = p2Name.x = app.screen.width *.5 - spriteScale*2;
    let p3Icon = new Sprite(Texture.from("p3_badge1.png"))
    p3Icon.anchor.set(0.5);
    p3Icon.x = p3Name.x = app.screen.width *.5;
    let p4Icon = new Sprite(Texture.from("p4_badge1.png"))
    p4Icon.anchor.set(0.5);
    p4Icon.x = p4Name.x = app.screen.width *.5 + spriteScale*2;
    let p5Icon = new Sprite(Texture.from("p5_badge1.png"))
    p5Icon.anchor.set(0.5);
    p5Icon.x = p5Name.x = app.screen.width *.5 + spriteScale*4;

    //icon characteristics
    p1Icon.height = p1Icon.width = spriteScale*2;
    p2Icon.height = p2Icon.width = p3Icon.height = p3Icon.width = p4Icon.height = p4Icon.width = p5Icon.height = p5Icon.width = spriteScale*1.5;
    p1Icon.y = p2Icon.y = p3Icon.y = p4Icon.y = p5Icon.y = app.screen.height*.45;
    p1Name.y = p2Name.y = p3Name.y = p4Name.y = p5Name.y = p1Icon.y+spriteScale*2;

    //non-character text elements
    let intro = new PIXI.Text("SPACE JUMP", {fontFamily: "Odibee Sans", fontSize: 90, fill: 0xe6eefc, align:"center"});
    let objective = new PIXI.Text("collect gems and reach the spaceship!", {fontFamily: "Odibee Sans", fontSize: 35, fill: 0xe6eefc, align:"center"});
    let displayInstructions = new PIXI.Text("<space> to toggle characters\n<enter> to begin game", {fontFamily: "Odibee Sans", fontSize: 27, fill: 0xc7d7ff, align:"center"});
    displayInstructions.anchor.set(0.5);
    intro.anchor.set(0.5);
    objective.anchor.set(0.5);
    displayInstructions.x = intro.x = objective.x =  app.screen.width*.5;
    displayInstructions.y = app.screen.height*.5 + spriteScale*4  ;
    intro.y = app.screen.height*.2;
    objective.y = app.screen.height*.28;

    //identifiers for character selection
    let players = [p1Icon, p2Icon, p3Icon, p4Icon, p5Icon];
    let names = [p1Name, p2Name, p3Name, p4Name, p5Name];
    let num = 0;
    let icon = players[num];
    let name = names[num];
    let space = keyboard(" ");
    space.subscribe();
    space.press = () => {
      num = (num+1) % 5;
      icon = players[num];
      name = names[num];
      icon.width = icon.height = spriteScale*2;
      if (num === 0) oldNum = 4;
      else oldNum = num-1;
      players[oldNum].width = players[oldNum].height = spriteScale*1.5;
      app.stage.removeChild(names[oldNum]);
      app.stage.addChild(name);
    }
    let enter = keyboard("Enter");
    enter.subscribe();
    enter.press = () => {
      enter.unsubscribe();
      space.unsubscribe();
      setup("p"+(num+1));
    }

    initializeMainStartElements();

    //create gems
    let gemTexture = Texture.from("gemYellow.png");
    startGems = new  Array();
    for (let i=0; i<20; i++){
      gem = new Sprite(gemTexture);
      gem.anchor.set(0.5);
      gem.height = gem.width = spriteScale*.9;
      if (i < 5){
        gem.y = ground.y - spriteScale;
        gem.x = app.screen.width*.5 + (i+1)*spriteScale;
      }
      else if (i < 9){
        gem.y = startGems[i-1].y - spriteScale*.9;
        gem.x = startGems[i-1].x + i*2;
      }
      else if (i < 10){
        gem.y = startGems[8].y - spriteScale*.5;
        gem.x = startGems[i-1].x + spriteScale*.8;
      }
      else{
        let num = 19-i;
        gem.y = startGems[num].y;
        gem.x = app.screen.width - startGems[num].x;
      }
      startGems.push(gem);
    }

    //add elements to stage
    app.stage.addChild(bg, p1Icon, p2Icon, p3Icon, p4Icon, p5Icon, ground, arrowLeft, arrowRight, p1, name);
    app.stage.addChild(displayInstructions, intro, objective);
    for (let i in startGems){
      app.stage.addChild(startGems[i]);
    }

    //start game loop
    state = playerMovementDynamics;
    app.ticker.add(delta => gameLoop(delta));
  }

  // setup for main game
  function setup(playerNum) {
    time = 0;
    numCoinsCollected = 0;

    //load spritesheets
    //playerSprites = Loader.shared.resources["Spritesheets/playerSprites1.json"].spritesheet.textures;
    let p1WalkTextures = [];

    let animations = {
        "p1_walk": [playerNum+"_walk1.png", playerNum+"_walk2.png"]
      };

    for (let i=0; i < 2; i++){
      p1WalkTextures[i] = Texture.from(animations.p1_walk[i]);
    }

    p1Textures= {"walkTextures" : p1WalkTextures,
      "duck": Texture.from(playerNum +"_duck.png"),
      "front": Texture.from(playerNum+"_front.png"),
      "hurt": Texture.from(playerNum+"_hurt.png"),
      "jump": Texture.from(playerNum+"_jump.png"),
      "stand": Texture.from(playerNum+"_stand.png")};

    enemyTextures = {
      "beeFlyTextures" : [Texture.from("bee.png"), Texture.from("bee_fly.png")],
      "beeHit" : Texture.from("bee_hit.png"),
      "beeDead" : Texture.from("bee_dead.png"),
      "flyFlyTextures" : [Texture.from("fly.png"), Texture.from("fly_fly.png")],
      "flyHit" : Texture.from("bee_hit.png"),
      "flyDead" : Texture.from("bee_dead.png"),
    }
    enemyTextures.beeFlyTextures[0].rotate=12;
    enemyTextures.beeFlyTextures[1].rotate=12;
    enemyTextures.flyFlyTextures[0].rotate=12;
    enemyTextures.flyFlyTextures[1].rotate=12;


    //---make sprites---
    // platforms
    let dirtTexture = Texture.from("castleHalf.png");

   //create starting platform
    for (let i=0; i<2; i++){
      let platform = new Sprite(Texture.from("grassHalf.png"));
      platform.y = app.screen.height*.75;
      platform.x = spriteScale*i + spriteScale*.5;
      platform.width = spriteScale;
      platform.height = spriteScale*.5;
      platforms.push(platform);
      app.stage.addChild(platform);
    }
    while (platforms[platforms.length-1].y > 0){
      generatePlatform(dirtTexture);
    }

    p1.x = spriteScale;
    p1.y = app.screen.height*.75 - spriteScaleHeight;
    p1.texture = p1Textures.stand;

    //exit
    exit = new Sprite(Loader.shared.resources["static/images/Spritesheets/backgrounds/ship.png"].texture);
    exit.anchor.set(0.5);
    exit.y = shipHeight;
    exit.x = app.screen.width*.6;
    exit.height = spriteScale*15;
    exit.width = spriteScale*10;
    exit.vy = 0;

    coinDisplay = new PIXI.Container();
    shipDisplay = new PIXI.Text(Math.abs(exit.y));

    //life count
    for (let i=0; i < lifeCount; i++){
      let life = new Sprite(Texture.from("hud_heartFull.png"));
      life.height = life.width = spriteScale*.5;
      life.y = 3;
      life.x = app.screen.width - spriteScaleHeight*.5 - (i * (spriteScaleHeight*.6));
      lives.push(life)
    }

    shipIcon = new Sprite(Loader.shared.resources["static/images/Spritesheets/backgrounds/shipIcon.png"].texture);
    shipIcon.height = spriteScale;
    shipIcon.width = spriteScale*1.25;
    shipIcon.y = shipIcon.x = 5;

    //Add elements to stage
    app.stage.addChild(bg);
    app.stage.addChild(ground);
    for (i in platforms){
      app.stage.addChild(platforms[i]);
    }
    for (i in coins){
      app.stage.addChild(coins[i]);
    }
    app.stage.addChild(exit);
    app.stage.addChild(p1);
    app.stage.addChild(shipIcon);
    app.stage.addChild(coinDisplay);
    app.stage.addChild(shipDisplay);
    for (let i in lives){
      app.stage.addChild(lives[i]);
    }



    //set game state
    state = play;
  }

  // gameLoop run by ticker (60/s), calls relevant script
  function gameLoop(delta) {
    state(delta);
  }

  // controls main gameplay
  function play(delta){
    time++;

    //determine platform speed
    speed = p1.vy;
    if (p1.y < 0) speed = 6;
    else if (p1.y < app.screen.height * .05) speed = 5;
    else if (p1.y < app.screen.height * .1) speed = 4.5;
    else if (p1.y < app.screen.height * .15) speed = 4;
    else if (p1.y < app.screen.height * .2) speed = 3.5;
    else if (p1.y < app.screen.height * .25) speed = 3;
    else if (p1.y < app.screen.height * .3) speed = 2.5;
    else if (p1.y < app.screen.height * .4) speed = 2.25;
    else if (p1.y < app.screen.height * .5) speed = 2;
    else if (p1.y < app.screen.height * .55) speed = 1.75;
    else if (p1.y < app.screen.height * .6) speed = 1.5;
    else if (p1.y < app.screen.height * .7) speed = 1.2;
    else if (p1.y < app.screen.height * .8) speed = 1;
    else if (p1.y < app.screen.height * .9) speed = .8;
    else speed = .6;

    //check collision and render coins
    for (let i in coins){
      if (testCollision(p1, coins[i])){
        app.stage.removeChild(coins[i]);
        coins.splice(i, 1);
        numCoinsCollected++;
      }
    }

    //display num coins
    coinDisplay.removeChildren();
    let gemDisplayIcon = new Sprite(Texture.from("gemYellow.png"));
    gemDisplayIcon.width = gemDisplayIcon.height = spriteScale;
    let gemCountMessage = new PIXI.Text("x " + numCoinsCollected, {fontFamily: "Odibee Sans", fontSize: 20, fill: 0xe6eefc});
    gemDisplayIcon.y = spriteScale*.5;
    gemCountMessage.y = spriteScale*.75;
    gemDisplayIcon.x = app.screen.width - gemCountMessage.width - spriteScale;
    gemCountMessage.x = app.screen.width - gemCountMessage.width - spriteScale*.1;
    coinDisplay.addChild(gemDisplayIcon, gemCountMessage);

    //display ship distance
    app.stage.removeChild(shipDisplay);
    let p1ShipDistance = Math.floor((p1.y - exit.y)*.1);
    shipDisplay = new PIXI.Text(": " + p1ShipDistance, {fontFamily: "Odibee Sans", fontSize: 20, fill: 0xe6eefc});
    shipDisplay.x = spriteScale*1.5;
    shipDisplay.y = spriteScale*.4;
    app.stage.addChild(shipDisplay);

    //generate platforms
    let lastPlatY = platforms[platforms.length-1].y
    if (lastPlatY >= 0 && lastPlatY >= exit.y+spriteScale*2){
      generatePlatform(Texture.from("castleHalf.png"));
    }

    //move, generate enemies
    if (Math.random() < .003){
      if (p1.x > app.screen.width*.25) {
        generateEnemy();
      }
    }
    if (enemies.length > 0){
      let cycle = Math.floor(Date.now() / 100) % 2;
      let num=0;
      while (num < enemies.length){
        if (enemies[num].x > app.screen.width+spriteScale){
          app.stage.removeChild(enemies[num]);
          enemies.splice(num, 1);
          continue;
        }
        let enemy = enemies[num];
        if (testCollision(p1, enemy)){
          lifeCount--;
          app.stage.removeChild(lives[lives.length-1]);
          lives.splice((lives.length-1),1);
          enemies.splice(num, 1);
          enemy.timeFromHit = 0;
          enemiesHit.push(enemy);
          continue;
        }
        enemy.x += enemy.vx;
        enemy.y+=speed;
        if (enemy.name == "bee") {
          enemy.texture = enemyTextures.beeFlyTextures[cycle];
        }
        else if (enemy.name == "fly"){
          enemy.texture = enemyTextures.flyFlyTextures[cycle];
        }
        num++;
      }
    }
    if (enemiesHit.length > 0){
      enemyHitSequence();
    }

    //move ground if necessary
    if (ground.y < app.screen.height + spriteScale*10){
        ground.y += ground.vy
    }

    //move exit, coins, platforms
    exit.y += speed;
    for (coin in coins){
      coins[coin].y += speed;
    }
    //move platforms, remove non-visible platforms
    let num = 0;
    while (num != platforms.length){
      platforms[num].vy = speed;
      platforms[num].y += platforms[num].vy;
      if (platforms[num].y > app.screen.height*1.1){
        platforms.splice(num, 1);
      }
      else{
        num++;
      }
    }

    playerMovementDynamics(speed);

    if (lifeCount <= 0){
      p1.texture = p1Textures.hurt;
      p1.vy = 16;
    }

    playerBottom = p1.y + p1.height*.5;
    //end game sequence
    if (playerBottom >= app.screen.height+spriteScale/2) {
      app.stage.removeChildren();
      let displayMessage = new PIXI.Text("game over!\nyou didn't make it to the ship\n\n <enter> to try again", {fontFamily: "Odibee Sans", fontSize: 40, fill: 0xe6eefc, align:"center"});
      displayMessage.anchor.set(0.5);
      displayMessage.y = app.screen.height*.5;
      displayMessage.x = app.screen.width*.5;
      app.stage.addChild(bg, displayMessage);
      state= end;
    }
    else if (exit.y > 0 && p1.y <= exit.y && (p1.x < exit.x+exit.width*.25) && (p1.x > exit.x-exit.width*.25)){
      app.stage.removeChildren();
      let wonMessage = "You made it!\n\n";
      //get score
      let timeBonus = 0;
      if (time < 10000) timeBonus = 10000-time;
      let coinBonus = numCoinsCollected * 50;
      let lifeBonus = lifeCount * 200;
      let score = 1000 + timeBonus + coinBonus + lifeBonus;
      let scoreMessage = "-------------------------\nSCORE: " +score
              + "\n-------------------------\n   ship reached: 1000\n   life bonus: (" +lifeCount+"x200): "+ lifeBonus + "\n   time bonus: "+timeBonus+"\n   gem bonus ("+numCoinsCollected+"x50): "
              + coinBonus + "\n\n   <enter> to play again";
      let wonDisplay = new PIXI.Text(wonMessage, {fontFamily: "Odibee Sans", fontSize: 35, fill: 0xe6eefc, align:"center"});
      wonDisplay.anchor.set(0.5);
      let displayMessage = new PIXI.Text( scoreMessage, {fontFamily: "Odibee Sans", fontSize: 35, fill: 0xe6eefc});
      displayMessage.anchor.set(0.5);
      displayMessage.y = app.screen.height*.5;
      displayMessage.x = wonDisplay.x = app.screen.width*.5;
      wonDisplay.y = displayMessage.y - displayMessage.height*.5 - spriteScale;
      app.stage.addChild(bg, displayMessage, wonDisplay);

      state = end;
    }

  }

  //run ending screen, enable restart key input
  function end(){
    let restart = keyboard("Enter");
    restart.subscribe();
    restart.press = () => {
      app.stage.removeChildren();
      restart.unsubscribe();
      reset();
    }

  }

  // resets stage for replay
  function reset(){
    time = 0;
    numCoinsCollected = 0;
    ground.y = app.screen.height - spriteScale*1.5;
    platforms.splice(0, platforms.length);
    coins.splice(0, coins.length);

    //create starting platform
    for (let i=0; i<2; i++){
      let platform = new Sprite(Texture.from("grassHalf.png"));
      platform.y = app.screen.height*.75;
      platform.x = spriteScale*i + spriteScale*.5;
      platform.width = spriteScale;
      platform.height = spriteScale*.5;
      platforms.push(platform);
      app.stage.addChild(platform);
    }

    let dirtTexture =  Texture.from("castleHalf.png");
    while (platforms[platforms.length-1].y > 0){
      generatePlatform(dirtTexture);
    }

    //reposition player, exit
    p1.y = app.screen.height*.75 - spriteScaleHeight;
    p1.x=spriteScale;
    p1._zIndex = 100000
    p1.vx = 0;
    p1.vy = 0;
    p1.surfaceOn = platforms[0];
    p1.jumping = false;
    p1.jumpHeight = p1.y;
    p1.hangtime = 0;
    p1.top = p1.y - p1.height*.5;
    p1.bottom = p1.y + p1.height*.5;
    p1.left = p1.x - p1.width*.5;
    p1.right = p1.x + p1.width*.5;
    //exit
    exit.y = shipHeight;;
    exit.vy = 0;

    //reset life count
    lives.splice(0, lives.length);
    lifeCount = 3;
    for (let i=0; i < lifeCount; i++){
      let life = new Sprite(Texture.from("hud_heartFull.png"));
      life.height = life.width = spriteScale*.5;
      life.y = 3;
      life.x = app.screen.width - spriteScaleHeight*.5 - (i * (spriteScaleHeight*.6));
      lives.push(life)
    }

    //Add elements to stage
    app.stage.addChild(bg);
    app.stage.addChild(ground);
    for (i in platforms){
      app.stage.addChild(platforms[i]);
    }
    for (i in coins){
      app.stage.addChild(coins[i]);
    }
    app.stage.addChild(exit);
    app.stage.addChild(p1);
    app.stage.addChild(coinDisplay);
    app.stage.addChild(shipIcon);
    for (let i in lives){
      app.stage.addChild(lives[i]);
    }

    state=play;


  }


