# Codeshare

For anyone in UCI's ICS courses (with Prof. Klefstad), you've probably had to use [GitCodings](https://gitcodings.com). Specifically during my quarter, we're barely able to connect to it, so I revamped and simplified the interface. 

**Check it out at [codeshare.opennote.me](https://codeshare.opennote.me).**
The API is hosted on AWS EC2 at [api.codeshare.opennote.me](https://api.codeshare.opennote.me).

This project is licensed under the GNU GPL v3.0 License - see the [LICENSE.md](LICENSE.md) file for details - and is built with NextJS and FastAPI.

Interested in contributing? Contact _abhigyaa[at]uci.edu_.


## Local Setup

```bash
# Clone the repository
git clone https://github.com/abhi-arya1/codeshare.git

# Setup Frontend (requires Bun)
cd codeshare
bun install 
# bun dev (for development)
# bun run build / bun run start (for webserver)

# Setup Backend (requires Python 3.12+)
cd api
# for Linux servers 
chmod +x ./setup.sh
./setup.sh 
# else
python3 -m venv .venv # must be named ".venv"
source .venv/bin/activate
pip install -r requirements.txt
pip install --upgrade pip
python run.py
```