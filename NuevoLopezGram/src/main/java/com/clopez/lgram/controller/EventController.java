package com.clopez.lgram.controller;

import java.util.ArrayList;
import java.util.Date;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.DeleteMapping;
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
			@RequestParam String creatorMail, @RequestParam String text, @RequestParam String multiMedia,
			@RequestParam(defaultValue = "image") String mediaType,
			@RequestParam(defaultValue = "false") boolean isComment,
			@RequestParam(defaultValue = "") String eventCommented) {
		// userId extracted from the auth token
		String userId = Jwts.parser().setSigningKey(SECRET).parseClaimsJws(token.replace("Bearer", "")).getBody()
				.getSubject();

		Optional<User> ou = uRep.findById(userId);
		if (ou.isEmpty())
			return new jsonStatus("NOT OK", "Invalid User");
		User u = ou.get();

		if (!creatorMail.equals(u.getEmail()))
			return new jsonStatus("NOT OK", "User does not match");

		Event ev = new Event(userId, text, multiMedia, mediaType);
		ev.setCreatorMail(creatorMail);
		ev.setCreatorName(u.getName());

		if (isComment) { // Es un comentario a otro evento
			if (eventCommented == null || eventCommented.equals(""))
				return new jsonStatus("NOT OK", "Trying to comment an inexistent event");
			Optional<Event> evo = eRep.findById(eventCommented);
			if (evo.isEmpty())
				return new jsonStatus("NOT OK", "Trying to comment an inexistent event");
			Event evParent = evo.get();
			evParent.addComment(ev.getId());
			evParent.incNumberAccess();
			evParent.setLastSeen(new Date());
			ev.setComment(true);
			if (eRep.save(evParent) == null)
				return new jsonStatus("NOT OK", "Cannot save parent event");
		}

		if (eRep.save(ev) != null) {
			u.setLastPost(new Date());
			u.setLastActivity(u.getLastPost());
			uRep.save(u);
			return new jsonStatus("OK", "Event saved");
		} else
			return new jsonStatus("NOT OK", "Cannot save event");
	}

	@GetMapping("/api/event")
	public @ResponseBody List<Event> requestEvent(@RequestParam(defaultValue = "5") String number,
			@RequestParam(defaultValue = "0") String pagenumber, @RequestParam(defaultValue = "false") String isComment,
			@RequestParam(defaultValue = "") String eventCommented) {

		List<Event> ret = new ArrayList();
		boolean isCom = Boolean.parseBoolean(isComment);

		if (!isCom) { // Return root events
			int pageNumber, numEvents;
			try {
				numEvents = Integer.parseInt(number);
				pageNumber = Integer.parseInt(pagenumber);
			} catch (NumberFormatException e) {
				pageNumber = 0;
				numEvents = 5;
			}

			// Implements "SELECT * FROM event WHERE isComment = false ORDER BY createdAt
			// DESC OFFSET 0
			// LIMIT number"

			ret = eRep.getLastParentEvents(numEvents);
		} else if (eventCommented != null && !eventCommented.equals("")) { // Return comments belonging to a certain
																			// event
			Optional<Event> evo = eRep.findById(eventCommented);
			if (evo.isEmpty()) // No "root" event ??
				return null;
			Event rootEvent = evo.get();
			Set<String> comments = rootEvent.getComments();
			for (String c : comments) {
				ret.add(eRep.findById(c).get());
			}
		}
		return ret;
	}
	
	@DeleteMapping("/api/event")
	public @ResponseBody jsonStatus deleteEvent(@RequestHeader(name = "Authorization") String token,
			@RequestParam String eventId) {
		String userId = Jwts.parser().setSigningKey(SECRET).parseClaimsJws(token.replace("Bearer", "")).getBody()
				.getSubject();
		Optional evo = eRep.findById(eventId);
		
		jsonStatus ret = new jsonStatus();
		
		if (evo.isEmpty())
			ret.setStatus("NOT OK", "Invalid eventId");
		else {
			Event ev = (Event) evo.get();
		
			if (ev.getCreatorId().equals(userId)) {
				String deleteWarning = "";
				if (ev.getComments().size() > 0) {// Hay comentarios que tenemos que borrar
					int i = 0;
					for (String commentId : ev.getComments()) {
						Optional<Event> c = eRep.findById(commentId);
						if (c.isPresent()) {
							moveToTrash(c.get());
							i++;
						}
					}	
					deleteWarning = " along with " + i + " comments";
				}
				// Ahora borramos el evento "raiz"
				moveToTrash(ev);
				ret.setStatus("OK", "Event Deleted " + deleteWarning);
			} else
			ret.setStatus("NOT OK", "Unathorized user");
		}
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
					String deleteWarning = "";
					if (ev.getComments().size() > 0) {// Hay comentarios que tenemos que borrar
						int i = 0;
						for (String commentId : ev.getComments()) {
							Optional<Event> c = eRep.findById(commentId);
							if (c.isPresent()) {
								moveToTrash(c.get());
								i++;
							}
						}
						deleteWarning = " along with " + i + " comments";
					}
					// Ahora borramos el evento "raiz"
					moveToTrash(ev);
					ret.setStatus("OK", "Event Deleted " + deleteWarning);
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

	private String moveToTrash(Event ev) {
		String deleteWarning = "";
		if (ev.getMultiMedia() != "")
			if (!mediaMoveToTrash(ev.getMultiMedia(), ev.getCreatorMail()))
				deleteWarning = "Warning!! Multimedia content cannot be deleted";
		eRep.delete(ev);
		return deleteWarning;
	}

	private boolean mediaMoveToTrash(String urlMedia, String creatorMail) {
		try {
			String objectName = urlMedia.substring(urlMedia.indexOf(creatorMail));
			objectName = objectName.substring(0, objectName.indexOf('?'));
			String blobName = picFolder + "/" + objectName;
			String copyBlobName = trashFolder + "/" + blobName.substring(blobName.indexOf('/') + 1);
			CopyRequest request = CopyRequest.newBuilder().setSource(BlobId.of(bucket, blobName))
					.setTarget(BlobId.of(bucket, copyBlobName)).build();
			com.google.cloud.storage.Blob blob = storage.copy(request).getResult();
			return storage.delete(BlobId.of(bucket, blobName));
		} catch (StringIndexOutOfBoundsException e) {
			return false;
		}

	}
}
