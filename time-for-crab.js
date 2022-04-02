const CRAB = "🦀";
const CAPTURED = "💰";
// Crab move distance in any direction
const STEP = 50;
const FONT = "Fairwater,Georgia,Times,Times New Roman,serif";
// Possible movement vectors, normalized
const DIRECTIONS = [
    [1, 0], [0, 1], [1, 1], [-1, 0], [0, -1], [-1, -1], [1, -1], [-1, 1]
];
// Area around the window borders where crabs will try to move away from
const BORDER_THRESHOLD = 50;
// Update interval
const INTERVAL = 400;
const States = {
    SUMMONED: 0,
    CAPTURED: 1,
    BEFRIENDED: 2,
    BELOVED: 3,
    REMOVED: 4
};
FRIEND_THRESHOLD = 30;
LOVE_THRESHOLD = 33;


const outerBorder = () => {
    return [window.innerWidth, window.innerHeight];
};

const withProbability = (fraction) => {
    return Math.random() < fraction;
}

const choice = (list) => {
    const c = Math.floor(Math.random() * list.length);
    return list[c];
}

const clamp = (min, val, max) => {
    return Math.max(min, Math.min(max, val));
}

const moveAwayFromBorder = (min, val, direction, max) => {
    if ((val - BORDER_THRESHOLD) < min) {
        // If we are close to the left/top border, move in the opposite direction
        return 1;
    } else if ((val + BORDER_THRESHOLD) > max) {
        // If we are close to the bottom/right border, move in the opposite direction
        return -1;
    }

    return direction;
}

let ui = null;

class Crab {
    constructor() {
        // Member variables
        let x = Math.floor(Math.random() * outerBorder()[0]);
        let y = Math.floor(Math.random() * outerBorder()[1]);
        this.state = States.SUMMONED;
        this.friendMeter = 0;
        this.touching = false;

        this.elem = document.createElement("div");
        this.elem.classList.add("time-for-crab-crab");
        this.setPosition(x, y)
        this.elem.innerHTML = CRAB;
        this.elem.addEventListener("click", () => this.capture());
        this.elem.addEventListener("mouseover", () => this.touching = true);
        this.elem.addEventListener("mouseout", () => this.touching = false);
        document.body.appendChild(this.elem);

        this.moodElem = document.createElement("span");
        this.moodElem.classList.add("mood");
        this.elem.appendChild(this.moodElem);

        ui.summoned++;
        ui.updateStats();
    }

    setPosition(x, y) {
        this.x = x;
        this.y = y;
        this.elem.style.left = `${x}px`;
        this.elem.style.top = `${y}px`;
    }

    update() {
        if (this.state !== States.CAPTURED && withProbability(0.25)) {
            const direction = choice(DIRECTIONS);
            this.move(direction);
        }

        // Update friendship state if touched with mouse
        if (this.touching && this.state === States.SUMMONED) {
            this.friendMeter += choice([0, 0, 1, 1, 1, 1, 2, 2, 3, 5]);

            if (this.friendMeter > (FRIEND_THRESHOLD / 2)) {
                this.mood("Friend?");
            }

            // Love threshold is slightly higher than friend threshold, therefore requires luck for a choice of 3 or 5 above
            if (this.friendMeter > LOVE_THRESHOLD) {
                this.state = States.BELOVED;
                this.mood("Love <3");
                ui.beloved++;
                ui.updateStats();
            }
            if (this.friendMeter > FRIEND_THRESHOLD) {
                this.state = States.BEFRIENDED;
                this.mood("Friend <3");
                ui.befriended++;
                ui.updateStats();
            }
        }

        // Remove captured crabs after a short time
        if (this.state === States.CAPTURED) {
            this.friendMeter--;
            if (this.friendMeter < -10) {
                this.elem.style.display = "none";
                this.state = States.REMOVED;
            }
        }
    }

    move(direction) {
        let [dx, dy] = direction;
        // Try to move away from the border
        dx = moveAwayFromBorder(0, this.x, dx, outerBorder()[0]);
        dy = moveAwayFromBorder(0, this.y, dy, outerBorder()[1]);

        // Confine the crabs to the browser window
        const newX = clamp(0, this.x + STEP * dx, outerBorder()[0]);
        const newY = clamp(0, this.y + STEP * dy, outerBorder()[0]);
        this.setPosition(newX, newY);
    }

    capture() {
        if (this.state === States.SUMMONED) {
            this.elem.innerHTML = CAPTURED;
            this.elem.appendChild(this.moodElem);
            this.state = States.CAPTURED;
            this.mood(":(");

            ui.captured++;
            ui.updateStats();
        }
    }

    mood(mood) {
        this.moodElem.innerHTML = mood;
    }
}

// A group of crabs is called a consortium :D (source: the internet)
let consortium = [];

class UI {
    constructor() {
        this.summoned = 0;
        this.captured = 0;
        this.befriended = 0;
        this.beloved = 0;

        this.parent = document.createElement("div");
        this.parent.classList.add("time-for-crab-ui");

        // Button
        this.button = document.createElement("button");
        this.button.classList.add("time-for-crab-button")
        this.button.innerHTML = "Summon Crab! 🪄"
        this.button.addEventListener("click", () => {
            consortium.push(new Crab());
        })
        this.parent.appendChild(this.button);

        // Interaction tracker (contains dynamic stats table created in createTable)
        this.tracker = document.createElement("div");
        this.tracker.classList.add("time-for-crab-tracker");
        this.parent.appendChild(this.tracker);

        document.body.appendChild(this.parent);
    }

    updateStats() {
        this.tracker.innerHTML = this.createTable([
            ["summoned", this.summoned],
            ["captured", this.captured],
            ["befriended", this.befriended],
            ["beloved", this.beloved]
        ]);
    }

    createTable(data) {
        let content = "<table>";
        for (let [text, val] of data) {
            if (val > 0) {
                content += `<tr><td>${text}:</td><td>${val}</td></tr>`;
            }
        }
        content += "</table>";
        return content;
    }
}

ui = new UI();

window.setInterval(() => {
    for (let crab of consortium) {
        crab.update();
    }

    // Remove crabs that have been captured for a while
    // (in reverse order because that preserves indices for following elements
    // according to https://stackoverflow.com/questions/9425009/remove-multiple-elements-from-array-in-javascript-jquery)
    for (let i = consortium.length-1; i >= 0; i--) {
        if (consortium[i].state === States.REMOVED) {
            consortium.splice(i, 1);
        }
    }
}, INTERVAL);