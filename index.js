async function ready() {
  const draw = deck("new");
  // store 20 cards to deal to player & dealer
  const pile = await draw(20).then(R.prop("cards"));
  // deal out initial hands
  let pHand = R.slice(0, 2, pile);
  let dHand = R.slice(2, 4, pile);
  let currentCard = 4;
  // dealer will hit when equal to or below `hitOn`
  const hitOn = 16;
  
  // game over if player at 21 points
  if (getScore(pHand) === 21) {
    return gameOver(pHand, dHand);
  } 
  
  // player wants to hit
  document.getElementById("hit").addEventListener("click", () => {
    // draw card from pile to player hand
    pHand = R.append(R.slice(currentCard++, currentCard, pile)[0], pHand);
    
    // game over if player at or over 21 points
    if (getScore(pHand) >= 21) {
      return gameOver(pHand, dHand);
    }
    
    // hit dealer if below `hitOn` points
    if (getScore(dHand) <= hitOn) {
      dHand = R.append(R.slice(currentCard++, currentCard, pile)[0], dHand);
    }
    
    // game over if dealer busts
    if (getScore(dHand) > 21) {
      return gameOver(pHand, dHand);
    }

    update("Player", pHand);
  });
  
  // player wants to stay, game over
  document.getElementById("stay").addEventListener("click", () => {
    // draw card from pile to dealer hand while under `hitOn` points
    while (getScore(dHand) <= hitOn) {
      dHand = R.append(R.slice(currentCard++, currentCard, pile)[0], dHand);
    }

    return gameOver(pHand, dHand);
  });

  update("Player", pHand);
}

// load game
ready();

//----- below the fold

// end game, disable buttons, display winner
function gameOver(pHand, dHand) {
  update("Player", pHand);
  update("Dealer", dHand);
  
  // disable hit & stay buttons
  document.getElementById("stay").disabled = true;
  document.getElementById("hit").disabled = true;
  
  // win/lose logic
  const gameOverStr =
    getScore(pHand) <= 21
      ? getScore(pHand) > getScore(dHand)
        ? "WIN" : getScore(dHand) <= 21 
          ? "LOSS" : "DEALER BUST" : "PLAYER BUST";
  
  document.getElementById("game-over").innerHTML = gameOverStr;
}

// render the supplied `hand` and score to div of id `name`
function update(name, hand) {
  renderCards(name, R.map(toImage, hand).join(""));
  renderScore(name, getScore(hand));
}

function renderCards(name, cards) {
  document.getElementById(R.toLower(name)).innerHTML = cards;
}

function renderScore(name, score) {
  const checkScore = (score === null) ? '' : score;
  document.getElementById(`${R.toLower(name)}-score`).innerHTML = `${R.toUpper(
    name
  )}: ${checkScore}`;
}

function toImage(json) {
  return `<img src="${R.prop("image", json)}" />`;
}

// get total score of given `hand` including aces
function getScore(hand) {
  const score = R.compose(
    R.reduce((a, v) => a + v, 0),
    R.map(codeToScore),
    R.map(R.prop("code"))
  )(hand);
  const aces = aceCount(hand);
  
  if (score > 21) {
    if (aces > 1) {
      for (var i = 1; i <= aces; i++) {
        if (score - i * 10 <= 21) {
          return score - i * 10;
        }
      }
    }

    return score - aces * 10;
  }

  return (score === 0) ? null : score;
}

// count the number of aces in a `hand`
function aceCount(hand) {
  return R.compose(
    R.reduce((a, v) => (v === 11 ? a + 1 : a), 0),
    R.map(codeToScore),
    R.map(R.prop("code"))
  )(hand);
}

// convert a card `code` into a blackjack score
function codeToScore(code) {
  const card = code.substr(0, 1);
  if (card === "A") {
    return 11;
  } else if (R.contains(card, ["K", "Q", "J", "0"])) {
    return 10;
  } else if (R.contains(card, ["2", "3", "4", "5", "6", "7", "8", "9"])) {
    return Number(card);
  }
  return null;
}

// retrieve a deck of `id` with `count` number of cards
function deck(id) {
  return function draw(count) {
    return fetch(
      `https://deckofcardsapi.com/api/deck/${id}/draw/?count=${count}`
    ).then(res => res.json());
  };
}