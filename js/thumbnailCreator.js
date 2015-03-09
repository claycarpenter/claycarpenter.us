var thumbnailCreator = function(projectName, thumbnailArray) {
	$("a.thumbImage").fancybox({
								'overlayShow' : true,
								'overlayColor' : "#333"
							});
	
	var thumbnailRolloverHandlerGenerator = function(
			thumbnailPath) {
		return function(mouseEvent) {
			var targetElmnt = mouseEvent.target;
			targetElmnt.src = thumbnailPath;
		}
	};
	
	var thumbnailContainerElmnt = $("#projectThumbnailContainer");
	for ( var i = 0, len = thumbnailArray.length; i < len; i++) {
		var thumbnail = thumbnailArray[i];
		var baseImagePath = "assets/images/" + projectName + "/" + thumbnail;
	
		var imageLinkElmnt = $("<a href='" + baseImagePath + ".png' class='thumbImage' rel='projectImages'/>");
		var thumbnailElmnt = $("<img src='" + baseImagePath + "-thumb-grayscale.png' class='thumbImage'/>");
	
		thumbnailElmnt
				.mouseover(thumbnailRolloverHandlerGenerator(baseImagePath
						+ "-thumb-color.png"));
		thumbnailElmnt
				.mouseout(thumbnailRolloverHandlerGenerator(baseImagePath
						+ "-thumb-grayscale.png"));
	
		thumbnailContainerElmnt.append(imageLinkElmnt);
		imageLinkElmnt.append(thumbnailElmnt);
	}
}
