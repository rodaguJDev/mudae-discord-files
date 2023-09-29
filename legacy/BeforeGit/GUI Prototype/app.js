const mudaeGUI = document.querySelector('.mudae-gui');

class Dragger {
    constructor() {
        this.isDragging = false;
        this.offsetX = 0;
        this.offsetY = 0;
        this.maxXPos = 0;
        this.maxYPos = 0;
    }

    startDrag(event) {
        if (event.target?.closest(".mudae-options")) {return;}

        this.isDragging = true
        this.offsetX = event.clientX - mudaeGUI.getBoundingClientRect().left;
        this.offsetY = event.clientY - mudaeGUI.getBoundingClientRect().top;

        this.maxXPos = window.innerWidth - mudaeGUI.offsetWidth;
        this.maxYPos = window.innerHeight - mudaeGUI.offsetHeight;
    }

    stopDrag() {
        this.isDragging = false;
    }

    updateDrag(event) {
        if (this.isDragging) {
            let x = event.clientX - this.offsetX;
            let y = event.clientY - this.offsetY;

            x = Math.min(Math.max(x, 0), this.maxXPos);
            y = Math.min(Math.max(y, 0), this.maxYPos);

            mudaeGUI.style.left = x + 'px';
            mudaeGUI.style.top = y + 'px';
        }
    }
}

const dragger = new Dragger();

mudaeGUI.addEventListener("mousedown", dragger.startDrag.bind(dragger));
window.addEventListener("mousemove", dragger.updateDrag.bind(dragger));
window.addEventListener("mouseup", dragger.stopDrag.bind(dragger));