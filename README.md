## Inspiration
The inspiration for this project came from watching where AI is heading in software. Tools like Claude Code, Cursor, and Lovable have made it dramatically easier for people to build complex digital products using natural language, even without deep technical expertise. That made us ask a simple question: if AI can make software this accessible, why cannot it do the same for hardware?

We saw drones as the perfect place to explore that idea. Drones are incredibly powerful tools with huge potential across everyday consumer use, industry, and government. They can inspect infrastructure, monitor land, capture aerial footage, respond to incidents, and perform repetitive operational tasks much faster than a person on the ground. But despite all of that potential, there is still a major barrier: actually flying and controlling a drone takes skill, time, and training. For many people, the benefits of drones are obvious, but the friction of learning to pilot one, or the cost of hiring a trained drone operator, makes them impractical for simple tasks.

That gap became the core problem we wanted to solve. We wanted to make drones more accessible in the same way modern AI tools have made coding, design, and website development more accessible. Instead of requiring users to manually control a drone or write low level flight logic, we imagined a system where someone could simply describe what they want the drone to do in natural language, and the drone could carry out that task intelligently.

We were also motivated by the fact that many programmable drone options are either limited, hard to access, or not built around the drones people already own. Rather than forcing users into a niche platform, we decided to build around DJI drones, because they are already widely used, trusted, and available. Our goal was to create an AI powered drone interface that brings the benefits of autonomy, programmability, and ease of use to a much larger audience.

At its core, this project is about lowering the barrier to entry for drone technology. We want to move drones from being tools that only trained pilots or technical specialists can fully use, to tools that anyone can direct through simple language and high level intent. In the same way AI is changing how people build software, we believe it can also change how people interact with physical machines in the real world.

## What it does
We built a web application that turns a supported DJI drone into an AI powered agent you can control with natural language, by either typing or speaking.

Instead of manually piloting the drone, users can give simple commands like "check if someone is on my field" and our Drone Agent handles the complexity behind the scenes. It uses tools like GPS, telemetry, drone state data, and vision models to understand the task, make decisions, and send the right commands to the drone in real time.

This unlocks powerful use cases like long range missions, property monitoring, and detecting events such as possible bushfires, all through a much simpler interface. We also built support for analyzing existing drone footage in natural language, so users can get value not just from live missions, but from past aerial data too.

In short, we are transforming drones from devices you have to fly manually into intelligent systems that can understand goals and carry out real world tasks autonomously.
## How we built it

**Android Bridging App**

• Built in Android Studio   
• Used Kotlin to develop the application.   
• Integrated DJI Mobile SDK (MSDK) to connect with the drone and access controls, telemetry, and video.  
• Used FFmpeg to stream live drone footage to our server.  
• Used RTMP protocol to host video streams over the internet for remote access

**Backend**

• Built a simple Express.js server to receive telemetry data and send back instructions.    
• Used Next.js server side components to communicate with the telemetry backend.  
• Integrated the OpenAI API to create the agent.  
• Used custom tools and an agentic loop to process telemetry data and make decisions.  
• Used RunPod Elastic containers to test video editing models and fine tunes from Hugging Face.  
• Used WebSockets to stream drone telemetry in real time.  
• Used the Arduino bridge as an option for longer distance telemetry transmission

**Frontend**

• Built the frontend using Next.js.  
• Deployed the frontend on Vercel.  
• Used React components to create the interface and website animations

**CI/CD**

• Used GitHub Actions to verify linting and deployments before merging branches.  
• Integrated our database and web MCP servers through OpenCode and Claude Code.  
• Used these tools to speed up development and improve agentic coding workflows.  
• Created a test Android simulation environment to test the agent before deploying it to the drone

**Hardware**

• Arduino board: main controller for telemetry data    
• GPS module: tracks location, speed, and altitude    
• Radio telemetry module: sends drone data wirelessly    
• Antenna: improves signal range and reliability    
• Battery monitoring module: checks battery voltage    
• Current sensor: measures power usage.  
• Barometer or altitude sensor: improves altitude tracking.  
• SD card module: stores flight data.  
• OLED display: shows live telemetry data.  
• Buzzer or alert module: gives warnings for issues.  
• Jumper wires: connect all components

## Challenges We Faced
The challenges we firstly was just connecting to the DJI Drone to the server. DJI has extremely specific requirements to send and recieve data as well as an extremely buggy SDK. This was also our first time building an Android App, so we had little experience with it. We overcame this challenge through sheer experimentation and just breaking things and trying out everything and anything in the Android SDK and surely after a while we began to get our bearings. 

Also it was most our first times flying a drone before, and understanding the mechanics of how these things communicate with the controller and how they stablise in the air. But again playing with the drone itself and 
## What we learned
Through building Sentinel AI, we learned far more than just how to write code. We gained hands on experience in Android app development, working with drone hardware, and building systems that operate in real time. We learned how drones behave in the air, what it takes to control them safely, and how to capture useful video footage effectively. On the hardware side, we also learned how to integrate GPS into our Arduino based telemetry system and use it to track drone data more reliably. Overall, the project taught us how to combine software, hardware, and real world testing into one working system.
## What's next for Sentinel AI
The next step for Sentinel AI is to make our simulation environment much more advanced so we can test more safely and more aggressively without risking damage to the drone. By improving the simulator, we can train and evaluate the agent in a more controlled way before deploying it in the real world. Beyond that, we want to scale the platform to support between 10 and 100 drones at once, allowing Sentinel AI to coordinate drone swarms rather than just a single drone. This would open the door to much more powerful use cases and make the system far more capable in real world environments.
