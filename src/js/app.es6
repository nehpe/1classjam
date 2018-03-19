/*jshint esversion: 6 */
import 'babel-polyfill';
import $ from 'jquery';

/**
# Damage Table
___________________________________
|       | Thrust | Slash  | Strike | Attacks
|-------+--------+--------+--------|
| Block |   1.0  |  0.0   |  0.5   |
|-------+--------+--------+--------|
| Dodge |   0.5  |  1.0   |  0.0   |
|-------+--------+--------+--------|
| Parry |   0.0  |  0.5   |  1.0   |
|----------------------------------|
  Defense
 */


class Game {
	constructor() {
		this._initVars();
		this._init($('#screen'));
		this._bind();
		this._resize();
		this._gameVars();
	}

	run() {
		this._drawLoop();
	}

	_drawLoop() {
		game.draw();
		requestAnimationFrame(game._drawLoop);
	}

	_initVars() {
		this.ctx = null;
		this.$e = $('#screen');
		this.e = $('#screen').get(0);
		this.name = this.$e.attr('name') || this.$e.attr('id');

		this.gameBackground = new Image();
		this.gameBackground.src = "img/background.png";

		this.floor = new Image();
		this.floor.src = "img/castleMid.png";

		this.attackingCardBackground = new Image();
		this.attackingCardBackground.src = "img/metalPanel_greenCorner.png";

		this.attackingCardBackgroundHover = new Image();
		this.attackingCardBackgroundHover.src = "img/metalPanel_greenCorner_hover.png";

		this.defendingCardBackground = new Image();
		this.defendingCardBackground.src = "img/metalPanel_redCorner.png";

		this.defendingCardBackgroundHover = new Image();
		this.defendingCardBackgroundHover.src = "img/metalPanel_redCorner_hover.png";

		this.playerImage = new Image();
		this.playerImage.src = "img/adventurer_stand.png";

		this.enemyImage = new Image();
		this.enemyImage.src = "img/zombie_stand_flipped.png";
	}

	_bind() {
		$(window)
			.on("resize", this._resize)
			.on("orientationchange", this._resize);

		var self = this;

		this.e.addEventListener('mousemove', function (evt) {
			self.setMousePos(evt);
		});
		this.e.addEventListener('click', function (evt) {
			self.click = true;
		});
	}

	_init(element) {
		this.ctx = element.get(0).getContext("2d");
	}

	_resize() {
		this.ctx.width = 1280;
		this.ctx.height = 720;
		this.e.width = 1280;
		this.e.height = 720;
	}

	width() {
		return this.e.width;
	}
	height() {
		return this.e.height;
	}

	setMousePos(event) {
		var rect = this.e.getBoundingClientRect();
		this.mousePos = {
			x: event.clientX - rect.left,
			y: event.clientY - rect.top
		};
	}

	getMousePos() {
		return this.mousePos;
	}

	// DGAF above here

	_gameVars() {
		this.lastDamage = null;
		this.lastDamageTicks = 0;
		this.lastDamageDirection = null;
		this._showDamage = false;
		this.ticks = 0;
		this.click = false;
		this.hoverCard = null;
		this.selectedCard = null;
		this.enemySelectedCard = null;
		this.mousePos = {
			x: 0,
			y: 0
		};
		this.player = {
			width: 100,
			height: 100,
			position: {
				x: 350,
				y: 250
			}
		};

		this.enemy = {
			width: 100,
			height: 100,
			position: {
				x: this.width() - 450,
				y: 250
			}
		};

		this.gameState = {
			health: 100,
			maxHealth: 200
		};

		this.healthbar = {
			position: {
				x: 40,
				y: 40
			},
			width: this.width() - 80,
			height: 50
		};

		this._playerAttackCards = [
			this.generateAttackCard(),
			this.generateAttackCard(),
			this.generateAttackCard(),
			this.generateAttackCard(),
			this.generateAttackCard(),
			this.generateAttackCard()
		];
		this._playerDefenseCards = [
			this.generateDefenseCard(),
			this.generateDefenseCard(),
			this.generateDefenseCard(),
			this.generateDefenseCard(),
			this.generateDefenseCard(),
			this.generateDefenseCard()
		];
		this._enemyAttackCards = [
			this.generateAttackCard(),
			this.generateAttackCard(),
			this.generateAttackCard(),
			this.generateAttackCard(),
			this.generateAttackCard(),
			this.generateAttackCard()
		];
		this._enemyDefenseCards = [
			this.generateDefenseCard(),
			this.generateDefenseCard(),
			this.generateDefenseCard(),
			this.generateDefenseCard(),
			this.generateDefenseCard(),
			this.generateDefenseCard()
		];

		this.playerAttacking = true;
		/* flowState
			null = title screen
			0 = select card
			1 = play card
			2 = end game
		*/
		this.flowState = null;
	}

	generateAttackCard() {
		return {
			power: this._getRandomInt(9),
			cardType: this._getRandomAttCardType()
		};
	}

	generateDefenseCard() {
		return {
			power: this._getRandomInt(9),
			cardType: this._getRandomDefCardType()
		};
	}

	_getRandomAttCardType() {
		let sel = this._getRandomInt(3);
		if (sel == 0) {
			return "S";
		} else if (sel == 1) {
			return "T";
		} else if (sel == 2) {
			return "L";
		}
	}

	_getRandomDefCardType() {
		let sel = this._getRandomInt(3);
		if (sel == 0) {
			return "P";
		} else if (sel == 1) {
			return "B";
		} else if (sel == 2) {
			return "D";
		}
	}

	_getRandomInt(max) {
		return Math.floor(Math.random() * Math.floor(max));
	}

	_drawOutlineText(size, text, pos_x, pos_y, offset, color) {
		offset = offset || 6;
		color = color || "#fff";
		this.ctx.font = size + "px 'Press Start 2P'";
		this.ctx.fillStyle = "#000";
		this.ctx.fillText(text, pos_x + offset, pos_y + offset);
		this.ctx.fillStyle = color;
		this.ctx.fillText(text, pos_x, pos_y);
	}

	_drawText(size, text, pos_x, pos_y, color) {
		color = color || "#fff";
		this.ctx.font = size + "px 'Press Start 2P'";
		this.ctx.fillStyle = color;
		this.ctx.fillText(text, pos_x, pos_y);
	}

	_drawHealth() {
		this._drawOutlineText(24, this.gameState.health, this.width() / 2 - 36, 76, 3);
	}

	_drawAttackDefendLabel() {
		this._drawOutlineText(24, this.playerAttacking ? "Attack" : "Defend", 20, 500, 3);
	}
	_drawVs() {
		this._drawOutlineText(48, "VS", 592, 644, 3);
	}

	_drawTitleScreen() {
		this._drawText(48, "Hey You! Let's Sword Fight!", 0, 300, "#fff");
		this._drawText(24, "Click to Start", 540, 500, "#c00");
		if (this.click) {
			this.flowState = 0;
		}
		this.click = false;
	}

	_drawEndScreen() {
		if (this.gameState.health == 200) {
			this._drawText(48, "Hooray! You Won. Try Again?", 0, 300, "#fff");
		} else {
			this._drawText(48, "Rats! You Died. Try Again?", 10, 300, "#fff");
		}
		this._drawText(24, "Click to Start", 540, 500, "#c00");
		if (this.click) {
			this.flowState = 0;
			this.gameState.health = 100;
			this.playerAttacking = true;
		}
		this.click = false;
	}

	draw() {
		if (this.flowState == null) {
			this._clear();
			this._drawTitleScreen();
			return;
		} else if (this.flowState == 2) {
			this._clear();
			this._drawEndScreen();
			return;
		}
		this._clearScreen();
		this._drawPlayer();
		this._drawEnemy();
		this._drawHealthbar();
		this._drawHealth();

		if (this.flowState == 0) {
			this._drawAttackDefendLabel();
			this._drawCardRow();
		} else if (this.flowState == 1) {
			if (this._showDamage)
			{
				if (!this.lastDamageDirection)
					this._drawOutlineText(32, "-"+this.lastDamage, this.player.position.x+10, this.player.position.y, 3, "#c00");
				else 
					this._drawOutlineText(32, "-"+this.lastDamage, this.enemy.position.x+10, this.enemy.position.y, 3, "#c00");
			}
			this.hoverCard = 0; // todo: hacky af
			let card;
			if (this.playerAttacking) {
				card = this._playerAttackCards[this.selectedCard];
				this._drawCard(1, card.cardType, card.power, true);
			} else {
				card = this._playerDefenseCards[this.selectedCard];
				this._drawCard(1, card.cardType, card.power, false);
			}

			this._drawVs();

			if (this.playerAttacking) {
				card = this._enemyDefenseCards[this.enemySelectedCard];
				this._drawCard(4, card.cardType, card.power, false);
			} else {
				card = this._enemyAttackCards[this.enemySelectedCard];
				this._drawCard(4, card.cardType, card.power, true);
			}

		}

		this.update();
	}

	_drawHealthbar() {
		this.ctx.strokeStyle = "#000";
		this.ctx.lineWidth = 4;
		this.ctx.strokeRect(
			this.healthbar.position.x,
			this.healthbar.position.y,
			this.healthbar.width,
			this.healthbar.height
		);
		this.ctx.strokeStyle = "#fff";
		this.ctx.lineWidth = 4;
		this.ctx.strokeRect(
			this.healthbar.position.x - 4,
			this.healthbar.position.y - 4,
			this.healthbar.width + 8,
			this.healthbar.height + 8
		);
		this.ctx.strokeStyle = "#000";
		this.ctx.lineWidth = 4;
		this.ctx.strokeRect(
			this.healthbar.position.x - 8,
			this.healthbar.position.y - 8,
			this.healthbar.width + 16,
			this.healthbar.height + 16
		);
		// background
		this.ctx.fillStyle = "#1989b8";
		this.ctx.fillRect(
			this.healthbar.position.x,
			this.healthbar.position.y,
			this.healthbar.width,
			this.healthbar.height
		);
		// foreground
		this.ctx.fillStyle = "#cd5d12";
		this.ctx.fillRect(
			this.healthbar.position.x,
			this.healthbar.position.y,
			(this.gameState.health / this.gameState.maxHealth) * this.healthbar.width,
			this.healthbar.height
		);
	}

	_drawCardRow() {
		let cardRow = (this.playerAttacking ? this._playerAttackCards : this._playerDefenseCards);
		for (let i = 0; i < cardRow.length; i++) {
			this._drawCard(i, cardRow[i].cardType, cardRow[i].power, this.playerAttacking);
		}
	}

	_drawCard(pos, cardType, power, attacking) {
		let img = attacking ? this.attackingCardBackground : this.defendingCardBackground;
		if (this.hoverCard == pos) {
			img = attacking ? this.attackingCardBackgroundHover : this.defendingCardBackgroundHover;
		}

		this.ctx.drawImage(
			img,
			10 + (pos * 210), 510
		);
		this._drawOutlineText(72, cardType, 10 + (pos * 210) + 70, 660);
		this._drawOutlineText(40, power, 10 + (pos * 210) + 30, 562, 3);
		let cardString = this._getCardString(cardType);
		this._drawOutlineText(24, cardString, 10 + (pos * 210) + 25, 694, 3);
	}

	_getCardString(cardType) {
		switch(cardType) {
			case 'B':
				return " BLOCK";
			case 'P':
				return " PARRY";
			case 'D':
				return " DODGE";
			case 'S':
				return "STRIKE";
			case 'L':
				return " LASH";
			case 'T':
				return "THRUST";
		}
	}


	switchSides() {
		if (this.gameState.health <= 0 || this.gameState.health >= this.gameState.maxHealth) {
			this.flowState = 2;
			return;
		}
		if (this.playerAttacking) {
			this._playerAttackCards[this.selectedCard] = this.generateAttackCard();
			this._enemyDefenseCards[this.enemySelectedCard] = this.generateDefenseCard();
		} else {
			this._enemyAttackCards[this.enemySelectedCard] = this.generateAttackCard();
			this._playerDefenseCards[this.selectedCard] = this.generateDefenseCard();
		}
		this.selectedCard = null;
		this.enemySelectedCard = null;

		this.playerAttacking = !this.playerAttacking;

		this.flowState = 0;
	}

	_drawPlayer() {
		this.ctx.drawImage(this.playerImage, this.player.position.x, this.player.position.y);
	}

	_drawEnemy() {
		this.ctx.drawImage(this.enemyImage, this.enemy.position.x, this.enemy.position.y);
	}

	_drawBackground() {
		this.ctx.drawImage(this.gameBackground, 0, 0);
	}
	_drawFloor() {
		this.ctx.drawImage(this.floor, 0, 360);
		this.ctx.drawImage(this.floor, 70, 360);
		this.ctx.drawImage(this.floor, 140, 360);
		this.ctx.drawImage(this.floor, 210, 360);
		this.ctx.drawImage(this.floor, 280, 360);
		this.ctx.drawImage(this.floor, 350, 360);
		this.ctx.drawImage(this.floor, 420, 360);
		this.ctx.drawImage(this.floor, 490, 360);
		this.ctx.drawImage(this.floor, 560, 360);
		this.ctx.drawImage(this.floor, 630, 360);
		this.ctx.drawImage(this.floor, 700, 360);
		this.ctx.drawImage(this.floor, 770, 360);
		this.ctx.drawImage(this.floor, 840, 360);
		this.ctx.drawImage(this.floor, 910, 360);
		this.ctx.drawImage(this.floor, 980, 360);
		this.ctx.drawImage(this.floor, 1050, 360);
		this.ctx.drawImage(this.floor, 1120, 360);
		this.ctx.drawImage(this.floor, 1190, 360);
		this.ctx.drawImage(this.floor, 1260, 360);
	}

	_clear() {
		this.ctx.clearRect(0, 0, this.ctx.width, this.ctx.height);
		this.ctx.fillStyle = "#111";
		this.ctx.fillRect(0, 0, this.ctx.width, this.ctx.height);
	}

	_clearScreen() {
		this._clear();
		this._drawBackground();
		this._drawFloor();
	}

	selectCard() {
		if (this.flowState == 0) {
			this.selectedCard = this.hoverCard;
			this.hoverCard = null;
			this.enemySelectedCard = this._getRandomInt(5);
			this.cardSelected();
		}
	}

	cardSelected() {
		this.flowState = 1;
		this.runBattle();
	}

	runBattle() {
		let playerCard, enemyCard;

		if (this.playerAttacking) {
			playerCard = this._playerAttackCards[this.selectedCard];
			enemyCard = this._enemyAttackCards[this.enemySelectedCard];
		} else {
			playerCard = this._playerDefenseCards[this.selectedCard];
			enemyCard = this._enemyAttackCards[this.enemySelectedCard];
		}

		this.simulateBattle(playerCard, enemyCard, this.playerAttacking);
	}

	simulateBattle(playerCard, enemyCard, playerAttacks) {
		let damageMultiple = 0; 
		let power = 0;
		let dmg = this._getRandomInt(12);

		if (playerAttacks) {
			damageMultiple = this._getDamageMultiple(playerCard.cardType, enemyCard.cardType);
			power = Math.max(1, (playerCard.power - enemyCard.power));
			this.gameState.health += (dmg * power) * damageMultiple;
		} else {
			damageMultiple = this._getDamageMultiple(enemyCard.cardType, playerCard.cardType);
			power = Math.max(1, (enemyCard.power - playerCard.power));
			this.gameState.health -= (dmg * power) * damageMultiple;
		}

		this.showDamage((dmg * power * damageMultiple), this.playerAttacking);

		this.gameState.health = this._clamp(this.gameState.health, 0, this.gameState.maxHealth);

		let self = this;
		setTimeout(function() {
			self.switchSides();
		}, 1000);
	}

	showDamage(amt, taking) {
		this.lastDamage = amt;
		this.lastDamageTicks = this.ticks;
		this.lastDamageDirection = taking;
		this._showDamage = true;
	}

	_clamp(a, b, c) {
		return Math.max(b,Math.min(c,a));
	}

	_getDamageMultiple(attackCardType, defenseCardType) {
		let damageMultiple = 0;
		if (attackCardType == "L") { // Player slashing
			if (defenseCardType == "B") {
				damageMultiple = 0;
			} else if (defenseCardType == "D") {
				damageMultiple = 2;
			} else {
				damageMultiple = 1;
			}
		} else if (attackCardType == "S") {
			if (defenseCardType == "B") {
				damageMultiple = 1;
			} else if (defenseCardType == "D") {
				damageMultiple = 0;
			} else {
				damageMultiple = 2;
			}
		} else {
			if (defenseCardType == "B") {
				damageMultiple = 2;
			} else if (defenseCardType == "D") {
				damageMultiple = 1;
			} else {
				damageMultiple = 0;
			}
		}
		return damageMultiple;
	}

	update() {
		var pos = this.getMousePos();
		if (pos.y > 514 && pos.y < 714) {
			if (pos.x > 14 && pos.x < 214) {
				this.hoverCard = 0;
			} else if (pos.x > 220 && pos.x < 420) {
				this.hoverCard = 1;
			} else if (pos.x > 430 && pos.x < 630) {
				this.hoverCard = 2;
			} else if (pos.x > 640 && pos.x < 840) {
				this.hoverCard = 3;
			} else if (pos.x > 850 && pos.x < 1050) {
				this.hoverCard = 4;
			} else if (pos.x > 1060 && pos.x < 1260) {
				this.hoverCard = 5;
			} else {
				this.hoverCard = null;
			}
		} else {
			this.hoverCard = null;
		}

		if (this.click && this.hoverCard != null) {
			this.selectCard();
		}

		this.click = false;
		this.ticks++;
	}
}

let game = new Game();
game.run();
