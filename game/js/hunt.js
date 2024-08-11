import { addToBackpack } from './backpack.js'

let character;
let battleLogs = [];
let currentBattleClock = 0;
let currentEnemy = {};
const BASE_CHARACTER_ACCURACY = 0.9;
const BASE_ENEMY_ACCURACY = 0.8;
const BATTLE_CLOCKS = ["🕛", "🕒", "🕕", "🕘"];
let battleTurnTimeout;
const INITIAL_HEALTH = 50;
const INITIAL_STRENGTH = 10;
const INITIAL_INTELLIGENCE = 5;
const HEALTH_GAIN_PER_LEVEL = 5;
const STRENGTH_GAIN_PER_LEVEL = 2;
const INTELLIGENCE_GAIN_PER_LEVEL = 1;

const getCharacterData = () => (character = getData("character"));

const showEnemiesList = () => {
    let enemiesSelect = document.querySelector("#choose-enemies");

    let unlockedEnemies = all_enemies.filter(
        (enemy) => enemy.level <= character.level
    );

    for (let enemy of unlockedEnemies) {
        let enemyOption = document.createElement("option");
        enemyOption.value = enemy.id;
        enemyOption.innerText = `${enemy.symbol} ${enemy.name}`;
        enemiesSelect.appendChild(enemyOption);
    }
}

const startBattle = (sameEnemy = false) => {
    battleLogs = [];
    currentBattleClock = 0;
    battleLogs.push("The battle has started");

    if (!sameEnemy) {
        let chooseEnemies = document.querySelector("select[name='chooseEnemies']");
        let chosenEnemyId = chooseEnemies.value;
        let enemy = all_enemies.find((en) => en.id == chosenEnemyId);
        // Clone enemy and set as currentEnemy (global variable)
        currentEnemy = JSON.parse(JSON.stringify(enemy));
    }

    currentEnemy.currentHealth = currentEnemy.maxHealth;
    battleTurn();
}

const battleTurn = () => {
    calculateBattleTurn();

    showBattleInformation();

    if (character.currentHealth == 0 || currentEnemy.currentHealth == 0) {
        if (character.currentHealth == 0) {
            alert(
                `Battle over!! The ${nameAndSymbol(currentEnemy)
				} won 💀\nYou lost 10% of your total experience and all of your gold.`
      		);
      		character = calculateLevelAndStats(applyDeathPenalty(character));
			returnToTown();
    	} else {
			let lootItems = calculateBattleLoot();
			let lootText = renderLootText(lootItems);
			character.experience += currentEnemy.experience;
			let previousLevel = character.level;
			character = calculateLevelAndStats(character);
			logBattleInfo("\n\nBattle over! You won, yay!! 🎉");
			logBattleInfo(`The ${nameAndSymbol(currentEnemy)} loot was: ${lootText}`);
			showBattleInformation(true);
			if (character.level > previousLevel) {
				alert(`You advanced to level ${character.level}!`);
			}
			setData("character", character);
		}
	} else {
		battleTurnTimeout = setTimeout(battleTurn, 1000);
	}
}

const calculateBattleTurn = () => {
    // Character attack
    if (Math.random() <= BASE_CHARACTER_ACCURACY) {
        let damageToEnemy = calculateDamageToEnemy();
        if (damageToEnemy > 0) {
            currentEnemy.currentHealth -= damageToEnemy;
            logDamage(damageToEnemy, true);
        }
    } else {
        logBattleInfo("You miss your attack!");
    }

    // Enemy attack
    if (Math.random() <= BASE_ENEMY_ACCURACY) {
        let damageToCharacter = calculateDamageToCharacter();
        if (damageToCharacter > 0) {
            character.currentHealth -= damageToCharacter;
            logDamage(damageToCharacter, false);
        }
    } else {
        logBattleInfo("The enemy misses their attack!");
    }

    // Prevent negative health values
    character.currentHealth = Math.max(character.currentHealth, 0);
    currentEnemy.currentHealth = Math.max(currentEnemy.currentHealth, 0);
}

const calculateDamageToEnemy = () => {
    let power = getCharacterPower();
    let damage = normalDistribution(power, 0.2 * power);
    let enemy_defense = getEnemyDefense();
    return Math.round(damage - enemy_defense);
}

const getCharacterPower = () => {
    let characterPower = 2 * character.level;
    if ("attack" in character.equippedWeapon) {
        characterPower += 3 * character.equippedWeapon.attack;
    }
    return characterPower;
}

const getEnemyDefense = () => {
    return 2 * currentEnemy.level + currentEnemy.defense;
}

const logDamage = (damage, toEnemy = true) => {
    let text;
    if (toEnemy) {
        text = `You hit the ${nameAndSymbol(currentEnemy)} for ${damage} damage.`;
    } else {
        text = `The ${nameAndSymbol(currentEnemy)} hit you for ${damage} damage.`;
    }
    logBattleInfo(text);
}

const nameAndSymbol = (enemy) => {
    return enemy.symbol + " " + enemy.name;
}

const logBattleInfo = (text) => {
    battleLogs.push(text);
}

const showBattleInformation = (battleOver = false) => {
    const startBattleButton = document.querySelector(".hunt__start-battle-button");
    const returnToTownButton = document.querySelector(".hunt_return-to-town-button");
	startBattleButton.style.display = "none";
	returnToTownButton.style.display = "none";
    showNameLevelAndExp();
    showCharacterInfo();
	const arena = document.querySelector(".hunt__arena");

    if (battleOver) {
		returnToTownButton.style.display = "none";
        // showBattleAgainButton();
    } else {
        showRunAwayButton(arena);
    }

    // VERSUS
    let enemyName = document.querySelector(".hunt__enemy--name");
	enemyName.style.display = "block";
    enemyName.innerText = `${character.name} vs. ${nameAndSymbol(currentEnemy)}`;

    showEnemyInformation();

    showBattleLogs();
}

const showNameLevelAndExp = () => {
    // Name and level
	const arena = document.querySelector(".hunt__arena");
    let characterNameAndLevel = document.querySelector(".hunt__player-name-and-level");
    characterNameAndLevel.innerText = `${character.name} - warrior level ${character.level}`;

    // Exp text
    let characterExpTitle = document.querySelector(".hunt__player-exp-label");
    let totExp = character.experience;
    characterExpTitle.innerText = `🛠 Exp - ${totExp}`;

    // Exp for next level
    let expNextLevel = document.querySelector(".hunt__player-exp-to-next-level");
    let expNext = expForNextLevel(totExp, character.level);
    expNextLevel.innerText = `(${expNext} for next level)`;

    // Experience Bar
    let characterExpBar = document.querySelector(".hunt__player-exp-bar");
    let percentageExp = character.experience - totalExpForLevel(character.level);
    percentageExp /=
        totalExpForLevel(character.level + 1) - totalExpForLevel(character.level);
    characterExpBar.setAttribute("value", Math.round(percentageExp * 100));
    characterExpBar.setAttribute("max", 100);
}

const showCharacterInfo = () => {
    // Character health
    let characterHealth = document.querySelector(".hunt__character-info-health");
    characterHealth.innerHTML = `&#128151; Health: <span style="color:${getHealthColor(
        character.currentHealth,
        character.maxHealth
    )};">${character.currentHealth}</span> / ${character.maxHealth}`;

    // Character strength
    let characterStrength = document.querySelector(".hunt__character-info-strength");
    characterStrength.innerText = `💪🏽 Strength: ${character.strength}`;

    // Character intelligence
    let characterIntelligence = document.querySelector(".hunt__character-info-intelligence");
    characterIntelligence.innerText = `📚 Intelligence: ${character.intelligence}`;
}

const showRunAwayButton = () => {
    const runAwayButton = document.querySelector(".hunt__run-away-button");
	runAwayButton.style.display = "block";
	runAwayButton.addEventListener("click", attemptToRun);
}

const showEnemyInformation = () => {
    const enemyHealth = document.querySelector(".hunt_enenemy--health");
	enemyHealth.style.display = "block";
    enemyHealth.innerHTML = `Enemy health: <span style="color:${getHealthColor(
        currentEnemy.currentHealth,
        currentEnemy.maxHealth
    )};">${currentEnemy.currentHealth}</span> / ${currentEnemy.maxHealth}`;
}

const showBattleLogs = () => {
	const battleLog = document.querySelector(".hunt__battle-log");
	battleLog.style.display = "block";

    const battleLogTitle = document.querySelector(".hunt__battle-log-title");
    battleLogTitle.innerText = `Battle logs ${BATTLE_CLOCKS[currentBattleClock]}`;
    currentBattleClock = (currentBattleClock + 1) % 4;

	const battleLogList = document.querySelector(".hunt__battle-log-list");
	battleLogList.innerText = "";

    if (battleLogs.length > 0) {
		for (let battleLogText of battleLogs.slice(-10)) {
			let battleLogListItem = document.createElement("li");
			battleLogListItem.innerText = battleLogText;
            battleLogList.appendChild(battleLogListItem);
        }
    }
}

const calculateDamageToCharacter = () => {
    let power = getEnemyPower();
    let damage = normalDistribution(power, 0.2 * power);
    let character_defense = getCharacterDefense();
    return Math.round(damage - character_defense);
}

const getCharacterDefense = () => {
    let defense = 3 * character.level + 1;
    if ("defense" in character.equippedShield) {
        defense += character.equippedShield.defense;
    }
    return defense;
}

const getEnemyPower = () => {
    return 2 * currentEnemy.level + 3 * currentEnemy.attack;
}

const startHunt = () => {
	getCharacterData();
	showEnemiesList();

	const startBattleButton = document.querySelector(".hunt__start-battle-button");
	startBattleButton.addEventListener("click", () => startBattle());
	showNameLevelAndExp();
	showCharacterInfo();
}

const calculateBattleLoot = () => {
    let lootItems = [];
    for (let possibleLoot of currentEnemy.loot) {
        let lottery = Math.random() * 100;
        if (lottery <= possibleLoot.chance) {
            let quantity = Math.ceil(Math.random() * possibleLoot.max);
            let item = retrieveItem(possibleLoot.itemId);
            item.quantity = quantity;
            lootItems.push(item);

            if (item.type === "gold") {
                character.gold += quantity;
            } else {
                addToBackpack(item.id, quantity, character);
            }
        }
    }
    return lootItems;
}

const calculateLevelAndStats = (character) => {
    let calculatedLevel =
        exp_table.filter((x) => x <= character.experience).length - 1;
    let levelChanged = calculatedLevel != character.level;

    character.level = calculatedLevel;
    character.maxHealth =
        (character.level - 1) * HEALTH_GAIN_PER_LEVEL + INITIAL_HEALTH;
    character.strength =
        (character.level - 1) * STRENGTH_GAIN_PER_LEVEL + INITIAL_STRENGTH;
    character.intelligence =
        (character.level - 1) * INTELLIGENCE_GAIN_PER_LEVEL + INITIAL_INTELLIGENCE;

    if (levelChanged) {
        // Character died or grew in level, both should restore life
        character.currentHealth = character.maxHealth;
    }
    return character;
}

const attemptToRun = () => {
    clearTimeout(battleTurnTimeout);
    let totalDamage = 0;
    for (let i = 0; i < 10; i++) {
        let damageToCharacter = calculateDamageToCharacter();
        totalDamage += damageToCharacter;
    }
    // Damage to character
    if (totalDamage > 0) {
        character.currentHealth -= totalDamage;
        logDamage(totalDamage, false);
    }
    if (character.currentHealth <= 0) {
        character.currentHealth = 0;
        alert(
            `While attempting to run, the ${nameAndSymbol(
                currentEnemy
            )} caught you and you fell in battle 💀\nYou lost 10% of your total experience and all of your gold.`
        );
        character = calculateLevelAndStats(applyDeathPenalty(character));
    } else {
        alert(
            `You succesfully ran away, but the ${nameAndSymbol(
                currentEnemy
            )} hit you for more ${totalDamage} damage`
        );
    }
    returnToTown();
}

const returnToTown = () => {
    setData("characterName", character.name);
    setData("character", character);
	history.back();
}

startHunt();