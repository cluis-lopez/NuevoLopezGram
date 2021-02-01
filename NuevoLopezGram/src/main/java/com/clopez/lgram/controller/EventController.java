package com.clopez.lgram.controller;

import java.util.ArrayList;
import java.util.Date;
import java.util.Iterator;
import java.util.LinkedList;
import java.util.List;
import java.util.Optional;


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
import com.clopez.lgram.datamodel.UserRepository;
import com.clopez.lgram.datamodel.jsonStatus;
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
	@Value("${max_events}")
	private int MAX_EVENTS;

	@Autowired
	private EventRepository eRep;

	@Autowired
	private UserRepository uRep;

	private static Storage storage = StorageOptions.getDefaultInstance().getService();

	@PostMapping("/api/event")
	public @ResponseBody jsonStatus createEvent(@RequestHeader(name = "Authorization") String token,
			@RequestParam String creatorMail, @RequestParam String text, @RequestParam String multiMedia,
			@RequestParam(defaultValue = "") String mediaType, @RequestParam(defaultValue = "") String location,
			@RequestParam(defaultValue = "false") boolean isComment,
			@RequestParam(defaultValue = "") String eventCommented) {
		// userId extracted from the auth token
		String userId = Jwts.parser().setSigningKey(SECRET).parseClaimsJws(token.replace("Bearer", "")).getBody()
				.getSubject();

		Optional<User> ou = uRep.findById(userId);
		if (ou.isEmpty())
			return new jsonStatus("NOT OK", "Invalid User");
		User user = ou.get();

		if (!creatorMail.equals(user.getEmail()))
			return new jsonStatus("NOT OK", "User does not match");

		Event ev = new Event(userId, text, multiMedia, mediaType);
		ev.setCreatorMail(creatorMail);
		ev.setCreatorName(user.getName());
		ev.setCreatorAvatar(user.getAvatar());
		ev.setLocation(location);

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
			user.setLastPost(new Date());
			user.setLastActivity(user.getLastPost());
			user.incNumPosts();
			uRep.save(user);
			return new jsonStatus("OK", "Event saved");
		} else
			return new jsonStatus("NOT OK", "Cannot save event");
	}

	@GetMapping("/api/event")
	public @ResponseBody List<Event> requestEvent(@RequestParam(defaultValue = "5") int numEvents,
			@RequestParam(defaultValue = "0") int offset, @RequestParam(defaultValue = "false") boolean isComment,
			@RequestParam(defaultValue = "") String eventCommented) {
		
		List<Event> ret = new ArrayList<Event>();
		
		if (numEvents > MAX_EVENTS) //Limit the number of events collected
			numEvents = MAX_EVENTS;

		if (!isComment) { // Return root events

			// Implements "SELECT * FROM event WHERE isComment = false ORDER BY createdAt
			// DESC OFFSET offset
			// LIMIT number"
			ret = eRep.getLastParentEvents(numEvents, offset);
			// Set the avatar of each user's event
			for (Event e : ret)
				uRep.findById(e.getCreatorId()).ifPresent(u -> e.setCreatorAvatar(u.getAvatar()));
			
		} else if (eventCommented != null && !eventCommented.equals("")) { // Return comments belonging to a certain
																			// event
			Optional<Event> evo = eRep.findById(eventCommented);
			if (evo.isEmpty()) // No "root" event ??
				return ret; //ret should be empty
			Event rootEvent = evo.get();
			LinkedList<String> comments = new LinkedList<>(rootEvent.getComments());
			Iterator<String> itr = comments.descendingIterator();
			while(itr.hasNext()) {
			    String c = itr.next();
			    Event e = eRep.findById(c).orElse(null);
			    uRep.findById(e.getCreatorId()).ifPresent(u -> e.setCreatorAvatar(u.getAvatar()));
				ret.add(e);
			}
		}
		return ret;
	}

	@DeleteMapping("/api/event")
	public @ResponseBody jsonStatus deleteEvent(@RequestHeader(name = "Authorization") String token,
			@RequestParam String eventId, @RequestParam(defaultValue = "") String parentId) {
		String userId = Jwts.parser().setSigningKey(SECRET).parseClaimsJws(token.replace("Bearer", "")).getBody()
				.getSubject();

		Optional<Event> evo = eRep.findById(eventId);
		if (evo.isEmpty())
			return new jsonStatus("NOT OK", "Invalid eventId");

		Event ev = evo.get();

		User user = uRep.findById(userId).get();
		
		if (!ev.getCreatorId().equals(userId))
			return new jsonStatus("NOT OK", "Unathorized user");

		if (ev.isComment()) { // Es un comentario asi que hay que eliminar su referencia del evento raiz
			if (parentId != null && !parentId.equals("")) {
				Optional<Event> pevo = eRep.findById(parentId);
				Event pev = null;
				if (pevo.isPresent()) {
					pev = pevo.get();
					pev.removeComment(eventId);
					eRep.save(pev);
				} else {
					return new jsonStatus("NOT OK", "No accedo al evento al que pertenece este comentario");
				}
			} else {
				return new jsonStatus("NOT OK", "No se puede acceder al evento al que pertenece este comentario");
			}
		}

		String deleteWarning = "";

		if (!ev.getComments().isEmpty()) {// Hay comentarios que tenemos que borrar
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
		deleteWarning += moveToTrash(ev);
		user.setLastActivity(new Date());
		uRep.save(user);
		return new jsonStatus("OK", "Event Deleted " + deleteWarning);
	}

	@PostMapping("/api/eventDetails")
	public @ResponseBody jsonStatus eventDetails(@RequestHeader(name = "Authorization") String token,
			@RequestParam String command, @RequestParam String eventId) {
		String userId = Jwts.parser().setSigningKey(SECRET).parseClaimsJws(token.replace("Bearer", "")).getBody()
				.getSubject();
		Optional<Event> evo = eRep.findById(eventId);

		jsonStatus ret = new jsonStatus();

		if (evo.isEmpty())
			ret.setStatus("NOT OK", "Invalid eventId");
		else {
			Event ev = (Event) evo.get();
			switch (command) {
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
