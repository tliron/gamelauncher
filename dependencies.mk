
dependencies.quantal:
	sudo apt-get install \
		valac-0.18 \
		libgee-dev \
		libgtk-3-dev \
		libunity-dev

dependencies.precise: .dependencies.precise.repositories dependencies.quantal

.dependencies.precise.repositories:
	sudo add-apt-repository ppa:vala-team
	sudo apt-get update
