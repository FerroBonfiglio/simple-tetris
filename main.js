function uid(){
    return Math.random().toString(16).slice(2);
}

const keys      = [ 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight' ];
const blocks    = {
    i : [
        [[0,0], [1,0], [2,0], [3,0]],
        [[0,0], [0,1], [0,2], [0,3]]
    ],
    o : [
        [[0,0], [0,1], [1,0], [1,1]]
    ],
    s : [
        [[1,0],[2,0],[0,1],[1,1]],
        [[0,0],[0,1],[1,1],[1,2]]
    ],
    j: [
        [[0,0],[0,1],[1,1],[2,1]],
        [[0,0],[1,0],[0,1],[0,2]],
        [[0,0],[1,0],[2,0],[2,1]],
        [[1,0],[1,1],[0,2],[1,2]],
    ],
    l: [
        [[2,0],[0,1],[1,1],[2,1]],
        [[0,0],[0,1],[0,2],[1,2]],
        [[0,0],[1,0],[2,0],[0,1]],
        [[0,0],[1,0],[1,1],[1,2]],
    ],
    z: [
        [[0,0],[1,0],[1,1],[2,1]],
        [[1,0],[0,1],[1,1],[0,2]]
    ],
    t: [
        [[1,0],[0,1],[1,1],[2,1]],
        [[0,0],[0,1],[1,1],[0,2]],
        [[0,0],[1,0],[2,0],[1,1]],
        [[1,0],[0,1],[1,1],[1,2]]
    ]
}

const colors    = {
    i: '#00efed',
    o: '#edf034',
    s: '#00f132',
    j: '#ef9623',
    l: '#1400e7',
    z: '#f00010',
    t: '#9800e8',
}


class Block {
    constructor(test){
        this.active     = test.active ?? true;
        this.id         = uid();
        this.lock       = false;
        this.lockTime   = 200;
        this.key        = [];
        this.x          = test.x || 3;
        this.y          = test.y || -1;
        this.variation  = 0;
        this.type       = this.randomBlock();
        this.cor        = [];
        this.color      = colors[this.type];
    }

    randomBlock(){
        const random = Math.round(Math.random() * (Object.entries(blocks).length - 1));
        return Object.entries(blocks)[random][0];
    }    
}


class Game {
    constructor() {
        this.canvas         = document.getElementById('canvas');
        this.ctx            = canvas.getContext("2d");
        this.count          = 0;
        this.frameRate      = 40;
        this.gravity        = 20;
        this.columns        = 10;
        this.rows           = 18;
        this.tileSize       = 20;
        this.stage          = [];
    }

    initialize(){
        // set dimensions
        this.canvas.width   = this.columns * this.tileSize;
        this.canvas.height  = this.rows * this.tileSize;

        // run game
        this.run();

        // add new block
        this.newBlock({}); 
        // this.newBlock({ active: false, y: 7, x: 6 });
        // this.newBlock({ active: false, y: 7, x: 0 }); 

    }

    newBlock(test){
        let block = new Block(test);
        this.calcCor(block);
        this.stage.push(block);
    }

    calcCor(block){
        let plan = blocks[block.type][block.variation];

        block.cor = plan.map((cor) => {
            return [cor[0] + block.x, cor[1] + block.y]
        });
    }

    drawBlock(block){
        block.cor.forEach((tile) => {
            this.ctx.fillStyle = block.color;
            this.ctx.fillRect(
                this.tileSize * tile[0],
                this.tileSize * tile[1],
                this.tileSize,
                this.tileSize,
            );
        });
    }

    checkCollision(block){

        let otherCors = [];
        this.stage.forEach((a) => {
            if(a.id !== block.id){
                a.cor.forEach((b) => {
                    otherCors.push(JSON.stringify(b));
                })
            }
        });                                    

        const noCollision = block.cor.every((cor) => {
            return (
                !otherCors.includes( JSON.stringify(cor) ) 
                && cor[1] < this.rows
                && cor[0] >= 0
                && cor[0] < this.columns
            );
        });

        return noCollision;

    }

    run(){
        setInterval(() => {
            // clear canvas
            this.clearCanvas()

            // draw grid
            //this.drawGrid();

            // passive blocks
            const passiveBlocks = this.stage.filter((block) => !block.active);
            let rows = {};
            
            passiveBlocks.forEach((block) => {
                // save all cordinates ordered by rows to check later if a row is full
                block.cor.forEach((cor) => {
                    if( rows[cor[1]] ){
                        rows[cor[1]].push(cor);
                    }else{
                        rows[cor[1]] = [cor];
                    }
                });
            });

            // check full rows
            let fullRows = [];
            rows = Object.entries(rows);
            rows.forEach((row) => {
                if( row[1].length === this.columns ){
                    fullRows.push(parseInt(row[0]));
                }
            });

            // delete full row
            if( fullRows.length > 0 ){
                
                // remove row
                passiveBlocks.forEach((block) => {

                    // get all cordinates on full row
                    const newCordinates = block.cor.filter((cor) => {
                        if( fullRows.includes(cor[1]) ){
                            return false;
                        }else{
                            return true;
                        }
                    });

                    // assign only cordinates on vacant rows
                    block.cor = newCordinates;

                });   

                // drop rows above full rows
                fullRows.forEach((row) => {
                    passiveBlocks.forEach((block) => {
                        block.cor.map((cor) => {
                            if( cor[1] < row ){
                                cor[1]++;
                            }
                        })
                    });
                })
            }        
            
            // drow passive blocks
            passiveBlocks.forEach((block) => {
                this.drawBlock(block);
            });


            // active blocks
            const activeBlocks = this.stage.filter((block) => block.active);
            activeBlocks.forEach((block) => {
                let clone = Object.assign(Object.create(Object.getPrototypeOf(block)), block);
    
                // gravity
                if( this.count % this.gravity === 0){
                    clone.y++;

                    this.calcCor(clone);
                
                    const noCollision = this.checkCollision(clone);

                    if(noCollision){
                        block = Object.assign(block, clone);
                    }else{
                        block.active = false;
                    }
                }

                this.drawBlock(block);  
            });          

            // create new block if no active block exist 
            if( activeBlocks.length === 0 ){
                this.newBlock({});
            }            

            this.count++;
        }, this.frameRate);
    }


    controls(type, key){
        
        // get active block
        let block = this.stage.filter((a) => a.active === true ).pop();

        if( block ){

            let clone = Object.assign(Object.create(Object.getPrototypeOf(block)), block);
            
            if( key === 'ArrowRight' ){
                // move block to right
                clone.x++;
            }else if( key === 'ArrowLeft' ){
                // move block to left
                clone.x--;
            }else if( key === 'ArrowDown' ){
                // move block to left
                clone.y++;
            }else if( key === 'ArrowUp' ){
                // cycle through block variations 
                let max = blocks[clone.type].length - 1;

                if( clone.variation < max ){
                    clone.variation++;
                }else{
                    clone.variation = 0;
                }
            }

            this.calcCor(clone);
            const noCollision = this.checkCollision(clone);
            if(noCollision){
                block = Object.assign(block, clone);
            }

        }
        
    }

    drawGrid(){
        for(let row = -1; row < this.rows; row++){
            for(let col = -1; col < this.columns; col++){

                this.ctx.strokeStyle = "#0000ff";
                this.ctx.lineWidth   = 1;

                this.ctx.strokeRect(this.tileSize, this.tileSize, col * this.tileSize, row * this.tileSize);
            }
        }
    }

    clearCanvas(){
        this.ctx.clearRect(0, 0, this.columns * this.tileSize, this.rows * this.tileSize);
    }

    

}


window.addEventListener('keydown', (e) => {
    if( keys.includes(e.key) ){
        game.controls('keydown', e.key);
    }
});


let game = new Game();
game.initialize();