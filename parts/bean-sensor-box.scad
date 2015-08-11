/*******************************************************************************
* Part: LightBlue Bean Sensor Box
* Rev : 0.1
* Date: 2015-01-19
*******************************************************************************/
$fn=24;
echo(str("$fn = ", $fn));
//boardRadius = 8;
boardRadius = 4 / (sqrt(2)-1);
echo(str("Board Radius = ", boardRadius));
boardLength = 47;  // bumped out 1mm after initial print test
boardWidth = 21;
boardDepth = 2;
boardStandoff = 5;
boardShellWall = 1;
supportWidth = 1.5;
beanFloor = 1;
floorBrim = 5;
cutOutRadius = (boardStandoff + boardDepth) / 2;
snapWidth = 1.5;
irY = 10;  // IR Y distance from origin
irD = 5;  // IR diameter

module boardShape(radius, length, width, height){
  // Center in X,Y and Z=0
  translate([-(width/2-radius),-(length/2-radius),0]){
    hull(){
      translate([0,0,0])
        cylinder(r=radius, h=height);
      translate([width-2*radius,0,0])
        cylinder(r=radius, h=height);
      translate([width-2*radius, length-2*radius, 0])
        cylinder(r=radius, h=height);
      translate([0, length-2*radius, 0])
        cylinder(r=radius, h=height);
    }
  }
}

// LightBlue Bean shell
difference(){
  boardShape(boardRadius + boardShellWall,
             boardLength+2*boardShellWall, 
             boardWidth+2*boardShellWall, 
             beanFloor+boardDepth+boardStandoff);
  translate([0,0,beanFloor])
    boardShape(boardRadius, 
               boardLength, 
               boardWidth, 
               boardStandoff+boardDepth);
  // Take out some wall to save material / time
  translate([-(boardWidth/2+boardShellWall),
             -(boardLength/2-1.5*boardRadius),
             beanFloor]){
    union(){
      hull(){
        translate([0,cutOutRadius,cutOutRadius])
          rotate([0,90,0]) cylinder(r=cutOutRadius, 
                                    h=boardWidth+2*boardShellWall+0.01);
        translate([0,boardLength-3*boardRadius-cutOutRadius,cutOutRadius])
          rotate([0,90,0]) cylinder(r=cutOutRadius, 
                                    h=boardWidth+2*boardShellWall+0.01);
      }
      translate([0,-cutOutRadius,cutOutRadius]){
        difference(){
          cube([boardWidth+2*boardShellWall+0.01,
                boardLength-3*boardRadius+2*cutOutRadius,
                20]);
          translate([0,0,0])
            rotate([0,90,0]) cylinder(r=cutOutRadius,
                                      h=boardWidth+2*boardShellWall+0.01);
          translate([0,boardLength-3*boardRadius+2*cutOutRadius,0])
            rotate([0,90,0]) cylinder(r=cutOutRadius,
                                      h=boardWidth+2*boardShellWall+0.01);
        }
      }
    }
  }
  // IR Opening
  translate([0,irY,0]) cylinder(h=boardStandoff+beanFloor, d=irD);

  // Take out some floor to save material / time
  /*
  boardShape(boardRadius-floorBrim, 
             boardLength-2*floorBrim,
             boardWidth-2*floorBrim,
             beanFloor);
  */
}

// LB Bean end supports
translate([0,0,beanFloor]){
  intersection(){
    boardShape(boardRadius, boardLength, boardWidth, boardStandoff);
    union(){
      // Battery side
      translate([-boardWidth/2, -boardLength/2, 0])
        cube([boardWidth,supportWidth,boardStandoff]);
      // Proto side
      translate([-boardWidth/2, boardLength/2, 0])
        cylinder(r=boardRadius*(sqrt(2)-1)+supportWidth, h=boardStandoff);
      translate([boardWidth/2, boardLength/2, 0])
        cylinder(r=boardRadius*(sqrt(2)-1)+supportWidth, h=boardStandoff);
    }
  }
}

// Clips
intersection(){
  // Create an intersection with the curve of the board / shell
  translate([0,0,beanFloor+boardStandoff+boardDepth])
    boardShape(boardRadius + boardShellWall,
               boardLength+2*boardShellWall, 
               boardWidth+2*boardShellWall, 
               snapWidth);
  union(){
    translate([-10,-boardLength/2,
               beanFloor+boardStandoff+boardDepth]){
      rotate([0,90,0]) cylinder(r=snapWidth, h=20);
      // This little bit is to sqare off the back of the clip
      translate([0,-snapWidth,-snapWidth])
        cube([20,snapWidth,2*snapWidth]);
    }
    translate([-10,boardLength/2,
               beanFloor+boardStandoff+boardDepth]){
      rotate([0,90,0]) cylinder(r=snapWidth, h=20);
      // This little bit is to sqare off the back of the clip
      translate([0,0,-snapWidth])
        cube([20,snapWidth,2*snapWidth]);
    }
  }
}

// IR support
translate([0,irY,0]) {
  difference() {
    cylinder(h=boardStandoff+beanFloor, d=irD+boardShellWall);
    cylinder(h=boardStandoff+beanFloor, d=irD);
  }
}
