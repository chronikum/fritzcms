# Fritz! CMS

#### no trademark infringement intended but it still is one

Are you tired of well built, well tested and established CMS solutions?

### Then I have the CMS for you!

This is Fritz! CMS. Hardly finished, no testing (yet) and build with no concept in mind.
I wanted to build something different at first, so if I change my mind about what it is it
could change again.

> **Don't ever use this in a production environment.**

~~As it provide no nice, not-seen features except the initial admin password is 12345 it comes very handy if you want to build a fast unsecure system with just another cms solution which is hardly maintained.~~

Hard to remember password are now generated when you start Fritz!CMS for the first time. It will appear in the Log. Which isn't secure. But, still - the password is randomly generated. It's not hashed or something secure like that, so if you forget it, just look in the database :)

## Setup

It is pretty straight forward, to run the server you can just do `npm start`.
I haven't thought about optimization yet and i am not sure if it will run if you just clone it.
By the way: Because I made some really clever startup scripts you have to create the `dist/` folder yourself and when it is not existing, it won't start.

I am pretty sure you could run a nginx reverse proxy to provide https, but then you should change the port which is currently `80`.

> **Don't ever use this in a production environment.**

Again, please do not use this seriously or in production. It can be fun to play around, but I just wanted to build a CMS which also serves HTML with EJS. It's just for practicing. The code is shit and Fritz!CMS has no intention being secure.
