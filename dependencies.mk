
dependencies: .dependencies.repositories
	sudo apt-get install \
		valac-0.20 \
		libgee-dev \
		libgtk-3-dev \
		libunity-dev

.dependencies.repositories:
	sudo add-apt-repository ppa:vala-team
	sudo apt-get update
