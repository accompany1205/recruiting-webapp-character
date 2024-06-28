import { useState, useEffect } from 'react';
import './App.css';
import { ATTRIBUTE_LIST, CLASS_LIST, SKILL_LIST } from './consts.js';

/**
 * Main application component
 */
function App() {
  const MAX_ATTRIBUTES = 70;
  const GITHUB_USERNAME = 'accompany1205'; // Replace with your GitHub username

  // State Hooks
  const [attributeVals, setAttributeVals] = useState(changeAttributeFromListToObj(10));
  const [attributeMods, setAttributeMods] = useState(changeAttributeFromListToObj(0));
  const [classesAchieved, setClassesAchieved] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [pointsSpendingMax, setPointsSpendingMax] = useState(10);
  const [skillPoints, setSkillPoints] = useState(createSkillList());
  const [skillTotals, setSkillTotals] = useState(createSkillList());
  const [characters, setCharacters] = useState([]);
  const [selectedCharacterIndex, setSelectedCharacterIndex] = useState(0);
  const [dc, setDC] = useState(10);
  const [rollResult, setRollResult] = useState(null);
  const [skillCheckResult, setSkillCheckResult] = useState(null);
  const [isCreatingNew, setCreatingNew] = useState(false);

  // Fetch characters on component mount
  useEffect(() => {
    fetch(`https://recruiting.verylongdomaintotestwith.ca/api/${GITHUB_USERNAME}/character`)
      .then((response) => response.json())
      .then((data) => {
        if (data.body) {
          setCharacters(data.body.characters || []);
        }
      });
  }, []);

  // Update selected character's attributes and skills when selection changes
  useEffect(() => {
    if (characters.length > 0) {
      const character = characters[selectedCharacterIndex] || [];
      setAttributeVals(character.attributeVals);
      setAttributeMods(character.attributeMods);
      setClassesAchieved(character.classesAchieved);
      setPointsSpendingMax(character.pointsSpendingMax);
      setSkillPoints(character.skillPoints);
      setSkillTotals(character.skillTotals);
    }
  }, [selectedCharacterIndex, characters]);

  /**
   * Converts ATTRIBUTE_LIST to an object with specified initial values
   * @param {number} initialValue - Initial value for attributes
   * @returns {Object} - Object with attributes as keys and initial values
   */
  function changeAttributeFromListToObj(initialValue) {
    return ATTRIBUTE_LIST.reduce((obj, curr) => {
      obj[curr] = initialValue;
      return obj;
    }, {});
  }

  /**
   * Creates a skill list object with initial values set to 0
   * @returns {Object} - Object with skill names as keys and initial values
   */
  function createSkillList() {
    return SKILL_LIST.reduce((obj, curr) => {
      obj[curr.name] = 0;
      return obj;
    }, {});
  }

  /**
   * Handles changes in attribute values
   * @param {string} attribute - Attribute name
   * @param {number} delta - Change in value (positive or negative)
   */
  function handleAttributeChange(attribute, delta) {
    const newAttributeVals = { ...attributeVals };
    const totalAttributes = Object.values(newAttributeVals).reduce((a, b) => a + b, 0);
    if ((totalAttributes + delta <= MAX_ATTRIBUTES && delta > 0) || delta < 0) {
      newAttributeVals[attribute] = Math.max(0, newAttributeVals[attribute] + delta);
      setAttributeVals(newAttributeVals);
      updateAttributeMods(newAttributeVals);
    }
  }

  /**
   * Updates attribute modifiers based on attribute values
   * @param {Object} attributeVals - Current attribute values
   */
  function updateAttributeMods(attributeVals) {
    const newAttributeMods = { ...attributeMods };
    for (const attr in attributeVals) {
      const val = attributeVals[attr];
      newAttributeMods[attr] = Math.floor((val - 10) / 2);
    }
    setAttributeMods(newAttributeMods);
    updateClassesAchieved(newAttributeMods);
  }

  /**
   * Updates the list of achieved classes based on attribute modifiers
   * @param {Object} attributeMods - Current attribute modifiers
   */
  function updateClassesAchieved(attributeMods) {
    const newClassesAchieved = [];
    for (const className in CLASS_LIST) {
      const requirements = CLASS_LIST[className];
      const meetsRequirements = ATTRIBUTE_LIST.every(attr => attributeVals[attr] >= requirements[attr]);
      if (meetsRequirements) {
        newClassesAchieved.push(className);
      }
    }
    setClassesAchieved(newClassesAchieved);
  }

  /**
   * Handles changes in skill points
   * @param {string} skill - Skill name
   * @param {number} delta - Change in value (positive or negative)
   */
  function handleSkillChange(skill, delta) {
    const newSkillPoints = { ...skillPoints };
    const pointsSpent = Object.values(newSkillPoints).reduce((a, b) => a + b, 0);
    if ((pointsSpent + delta <= pointsSpendingMax && delta > 0) || delta < 0) {
      newSkillPoints[skill] = Math.max(0, newSkillPoints[skill] + delta);
      setSkillPoints(newSkillPoints);
      updateSkillTotals(newSkillPoints);
    }
  }

  /**
   * Updates total skill values based on skill points and attribute modifiers
   * @param {Object} skillPoints - Current skill points
   */
  function updateSkillTotals(skillPoints) {
    const newSkillTotals = { ...skillTotals };
    for (const skill of SKILL_LIST) {
      const attrMod = attributeMods[skill.attributeModifier];
      newSkillTotals[skill.name] = skillPoints[skill.name] + attrMod;
    }
    setSkillTotals(newSkillTotals);
  }

  /**
   * Handles saving the current character data to the server
   * @param {Event} e - Event object
   */
  function handleSave(e) {
    e.preventDefault();
    console.log(selectedCharacterIndex, attributeVals);

    const currentCharacterData = {
      attributeVals,
      attributeMods,
      classesAchieved,
      pointsSpendingMax,
      skillPoints,
      skillTotals
    };
  
    // Create a new characters array with the updated character data
    const updatedCharacters = characters.length === 0 
      ? [currentCharacterData] 
      : characters.map((character, index) => (
        index === Number(selectedCharacterIndex) ? currentCharacterData : character
      ));
  
    // Create the data object to be sent
    const data = { characters: updatedCharacters };

    fetch(`https://recruiting.verylongdomaintotestwith.ca/api/${GITHUB_USERNAME}/character`, {
      method: "post",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    .then(response => response.json())
    .then(()=>{
      setCharacters(data.characters)
    });
  }

  /**
   * Handles rolling a random number and calculating the skill check result
   */
  function handleRoll() {
    const randomRoll = Math.floor(Math.random() * 20) + 1;
    setRollResult(randomRoll);
    const selectedSkill = document.getElementById("skillSelect").value;
    const totalSkill = skillTotals[selectedSkill];
    setSkillCheckResult(randomRoll + totalSkill >= dc ? "Success" : "Failure");
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>Character Sheet</h1>
      </header>
      <section className="App-section">
        <div className='content-header'>
          <div className='content-header-characters-list'>
            <h2>Characters</h2>
            <select onChange={(e) => setSelectedCharacterIndex(e.target.value)} value={selectedCharacterIndex}>
              {characters.length > 0 && characters.map((character, index) => (
                <option key={`character ${index}`} value={index}>
                  {character.classesAchieved.length > 0 ? `Character ${index + 1} - ${character.classesAchieved.join(" ")}` : `Character ${index}`}
                </option>
              ))}
            </select>
          </div>
          <div className='content-header-skill-check ml-1 mr-1'>
            <h2>Skill Check</h2>
            <div>
              Skill:
              <select id="skillSelect">
                {SKILL_LIST.map(skill => (
                  <option key={skill.name} value={skill.name}>{skill.name}</option>
                ))}
              </select>
            </div>
            <div>
              DC: <input type="number" value={dc} onChange={(e) => setDC(Number(e.target.value))} />
            </div>
            <button onClick={handleRoll}>Roll</button>
            {rollResult !== null && (
              <div>
                <div>Roll Result: {rollResult}</div>
                <div>Skill Check: {skillCheckResult}</div>
              </div>
            )}
          </div>
          <div className='content-header-party-skill-check'>
            <h2>Party Skill Check</h2>
            <div>
              Skill:
              <select id="partySkillSelect">
                {SKILL_LIST.map(skill => (
                  <option key={skill.name} value={skill.name}>{skill.name}</option>
                ))}
              </select>
            </div>
            <button onClick={() => {
              const highestSkillCharacter = characters.reduce((prev, curr) => {
                const selectedSkill = document.getElementById("partySkillSelect").value;
                return (prev.skillTotals[selectedSkill] > curr.skillTotals[selectedSkill]) ? prev : curr;
              });
              const randomRoll = Math.floor(Math.random() * 20) + 1;
              setRollResult(randomRoll);
              const selectedSkill = document.getElementById("partySkillSelect").value;
              const totalSkill = highestSkillCharacter.skillTotals[selectedSkill];
              setSkillCheckResult(randomRoll + totalSkill >= dc ? "Success" : "Failure");
            }}>Party Roll</button>
          </div>
        </div>
        <div className='content-body'>
          <div>
            <h2>Attributes</h2>
            {ATTRIBUTE_LIST.map(attribute => (
              <div key={attribute}>
                {attribute}: {attributeVals[attribute]}
                <button className='ml-1' onClick={() => handleAttributeChange(attribute, 1)}>+</button>
                <button className='mr-1' onClick={() => handleAttributeChange(attribute, -1)}>-</button>
                Modifier: {attributeMods[attribute]}
              </div>
            ))}
          </div>
          <div className='content-body-class-column'>
            <h2>Classes</h2>
            {Object.keys(CLASS_LIST).map(className => (
              <div key={className}>
                <span>{className}</span>
                {classesAchieved.includes(className) && <span> - Achieved</span>}
                <button onClick={() => setSelectedClass(className)}>Select</button>
              </div>
            ))}
          </div>
          {selectedClass && (
            <div>
              <h3>Selected Class: {selectedClass}</h3>
              <div>
                <h4>Requirements</h4>
                {Object.entries(CLASS_LIST[selectedClass]).map(([attr, val]) => (
                  <div key={attr}>{attr}: {val}</div>
                ))}
              </div>
              <button onClick={() => setSelectedClass("")}>Cancel</button>
            </div>
          )}
          <div>
            <h2>Skills</h2>
            {SKILL_LIST.map(skill => (
              <div key={skill.name}>
                {skill.name} - points: {skillPoints[skill.name]}
                <button className='ml-1' onClick={() => handleSkillChange(skill.name, 1)}>+</button>
                <button className='mr-1' onClick={() => handleSkillChange(skill.name, -1)}>-</button>
                modifier ({skill.attributeModifier}): {attributeMods[skill.attributeModifier]}
                total: {skillTotals[skill.name]}
              </div>
            ))}
          </div>
        </div>
        <div className='content-footer mt-1'>
          <div>
            <button className='ml-1' onClick={() => {
              if(!isCreatingNew){
                setCharacters(_characters => [..._characters, {
                  attributeVals: changeAttributeFromListToObj(10), 
                  attributeMods: changeAttributeFromListToObj(0), 
                  classesAchieved: [], 
                  pointsSpendingMax: 10, 
                  skillPoints: createSkillList(), 
                  skillTotals: createSkillList(),
                }]);
                setSelectedCharacterIndex(characters.length);
                setCreatingNew(true);
              }else{
                alert(`Complete the process of exsiting creation!`);
              }
            }}>Add Character</button>
            {isCreatingNew && (
              <button className='ml-1 mr-1' onClick={() => {
                setSelectedCharacterIndex(characters.length - 2);
                setCharacters(_characters => {
                  const items = [..._characters];
                  items.pop();
                  return items;
                })
                setCreatingNew(false);
              }}>Cancel Creation</button>
            )}

          </div>
          <button className='ml-1' onClick={handleSave}>Save Character</button>
        </div>
      </section>
    </div>
  );
}

export default App;
