package com.clopez.lgram.controller;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

import com.clopez.lgram.datamodel.Event;
import com.clopez.lgram.datamodel.EventRepository;
import com.clopez.lgram.datamodel.User;
import com.clopez.lgram.datamodel.UserPublic;
import com.clopez.lgram.datamodel.UserRepository;
import com.clopez.lgram.datamodel.jsonStatus;
import com.clopez.lgram.security.JwtTokenUtil;
import com.google.cloud.storage.BlobId;
import com.google.cloud.storage.Storage;
import com.google.cloud.storage.StorageOptions;
import com.google.cloud.storage.Storage.CopyRequest;

import io.jsonwebtoken.Jwts;

@RestController
public class EventController {

	@Value("${jwt.secret}")
	private String SECRET;
	@Value("${gcp_storage_bucket}")
	private String bucket;
	@Value("${pictures_folder}")
	private String picFolder;
	@Value("${trash_folder}")
	private String trashFolder;

	@Autowired
	private EventRepository eRep;

	@Autowired
	private UserRepository uRep;

	private static Storage storage = StorageOptions.getDefaultInstance().getService();

	@PostMapping("/api/event")
	public @ResponseBody jsonStatus createEvent(@RequestHeader(name = "Authorization") String token,
			@RequestParam String creatorMail, @RequestParam String text, @RequestParam String multiMedia) {
		// userId extracted from the auth token
		String userId = Jwts.parser().setSigningKey(SECRET).parseClaimsJws(token.replace("Bearer", "")).getBody()
				.getSubject();

		Optional<User> ou = uRep.findById(userId);
		if (ou.isEmpty())
			return new jsonStatus("NOT OK", "Invalid User");
		User u = ou.get();

		if (!creatorMail.equals(u.getEmail()))
			return new jsonStatus("NOT OK", "User does not match");

		Event ev = new Event(userId, text, multiMedia);
		ev.setCreatorMail(creatorMail);
		ev.setCreatorName(u.getName());

		if (eRep.save(ev) != null) {
			u.setLastPost(new Date());
			u.setLastActivity(u.getLastPost());
			uRep.save(u);
			return new jsonStatus("OK", "Event saved");
		} else
			return new jsonStatus("NOT OK", "Cannot save event");
	}

	@GetMapping("/api/event")
	public @ResponseBody List<Event> requestEvent(@RequestParam(value = "number", defaultValue = "5") String number,
			@RequestParam(value = "pagenumber", defaultValue = "0") String pagenumber) {

		int pageNumber, numEvents;
		try {
			numEvents = Integer.parseInt(number);
			pageNumber = Integer.parseInt(pagenumber);
		} catch (NumberFormatException e) {
			pageNumber = 0;
			numEvents = 5;
		}

		// Implement something like "SELECT * FROM c ORDER BY c.createdAt DESC OFFSET 0
		// LIMIT number"

		List<Event> ret = eRep.getLastEvents(numEvents);
		return ret;
	}

	@PostMapping("/api/eventDetails")
	public @ResponseBody jsonStatus eventDetails(@RequestHeader(name = "Authorization") String token,
			@RequestParam String command, @RequestParam String eventId) {
		String userId = Jwts.parser().setSigningKey(SECRET).parseClaimsJws(token.replace("Bearer", "")).getBody()
				.getSubject();
		Optional evo = eRep.findById(eventId);

		jsonStatus ret = new jsonStatus();

		if (evo.isEmpty())
			ret.setStatus("NOT OK", "Invalid eventId");
		else {
			Event ev = (Event) evo.get();
			switch (command) {
			case "remove":
				if (ev.getCreatorId().equals(userId)) {
					if (ev.getMultiMedia() != "")
						if (!moveToTrash(ev.getMultiMedia(), ev.getCreatorMail()))
							;
					String deleteWarning = "Warning!! Multimedia content cannot be deleted";
					eRep.delete(ev);
					ret.setStatus("OK", "Event removed " + deleteWarning);
				} else
					ret.setStatus("NOT OK", "Unathorized user");
				break;
			case "thumbsUp":
				if (ev.getCreatorId().equals(userId))
					ret.setStatus("NOT OK", "No te des likes a ti mismo capuyo");
				else if (ev.addLike(userId)) {
					eRep.save(ev);
					ret.setStatus("OK", "You like this");
				} else
					ret.setStatus("OK", "You already liked this");
				break;
			case "thumbsDown":
				if (ev.getCreatorId().equals(userId))
					ret.setStatus("NOT OK", "No te des dislikes a ti mismo capuyo");
				else if (ev.addDislike(userId)) {
					eRep.save(ev);
					ret.setStatus("OK", "You hate this");
				} else
					ret.setStatus("OK", "You already hated this");
				break;
			}
		}
		return ret;
	}

	private boolean moveToTrash(String urlMedia, String creatorMail) {
		String objectName = urlMedia.substring(urlMedia.indexOf(creatorMail));
		objectName = objectName.substring(0, objectName.indexOf('?'));
		String blobName = picFolder + "/" + objectName;
		String copyBlobName = trashFolder + "/" + blobName.substring(blobName.indexOf('/') + 1);
		CopyRequest request = CopyRequest.newBuilder().setSource(BlobId.of(bucket, blobName))
				.setTarget(BlobId.of(bucket, copyBlobName)).build();
		com.google.cloud.storage.Blob blob = storage.copy(request).getResult();
		return storage.delete(BlobId.of(bucket, blobName));

	}
}
