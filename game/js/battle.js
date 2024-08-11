export const calculateDamageToEnemy = () => {
    let power = getCharacterPower();
    let damage = normalDistribution(power, 0.2 * power);
    let enemy_defense = getEnemyDefense();
    return Math.round(damage - enemy_defense);
}

export const getCharacterPower = () => {
    let characterPower = 2 * character.level;
    if ("attack" in character.equippedWeapon) {
        characterPower += 3 * character.equippedWeapon.attack;
    }
    return characterPower;
}

export const getEnemyDefense = () => {
    return 2 * currentEnemy.level + currentEnemy.defense;
}

export const calculateDamageToCharacter = () => {
    let power = getEnemyPower();
    let damage = normalDistribution(power, 0.2 * power);
    let character_defense = getCharacterDefense();
    return Math.round(damage - character_defense);
}

export const getCharacterDefense = () => {
    let defense = 3 * character.level + 1;
    if ("defense" in character.equippedShield) {
        defense += character.equippedShield.defense;
    }
    return defense;
}

export const getEnemyPower = () => {
    return 2 * currentEnemy.level + 3 * currentEnemy.attack;
}