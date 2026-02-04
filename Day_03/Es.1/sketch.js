function setup(){
    createCanvas(400, 400);
    background(200);
}

function draw(){
    
   // rect(10, 10, 20, 30)
   // line(40, 50, 100, 200)
    //text("Hello world", mouseX, mouseY)
    textSize(36)
    textAlign(CENTER, CENTER)
    fill(random(255), random(255), random(255))
    //text("DB" + mouseX + "," + mouseY, mouseX, mouseY)
    text("DB" , width/2, height/2)
    textFont('Courier New')
    
    let c = get(0, 0, width, height)
    translate(width/2, height/2)
    rotate(mouseX * 0.001)
    imageMode(CENTER)
    image(c, mouseX * 0.1, mouseY * 0.1, c.width * 1.1, c.height * 1.1)

  


    
}