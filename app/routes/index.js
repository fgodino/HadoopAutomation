

var renderIndex = function (req, res) {
	res.sendfile(path.join(__dirname, 'views/index.html'));
});

module.exports = renderIndex;