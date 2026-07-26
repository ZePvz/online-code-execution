class Semaphore {
    constructor(locks){
        this.currentLock = 0;
        this.maxLock = locks;
        this.requestQueue = [];
    }

    async acquire() {
        if(this.currentLock < this.maxLock){
            this.currentLock++;
            return;
        }
        return new Promise((resolve)=>{
            this.requestQueue.push(resolve);
        })
    }

    release(){
        if(this.requestQueue.length > 0){
            const next = this.requestQueue.shift();
            next();
        }
        else{
            this.currentLock--;
        }
    }
}

module.exports = Semaphore
