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

import io.jsonwebtoken.Jwts;

@RestController
public class EventController {

	@Value("${jwt.secret}")
	String SECRET;

	@Autowired
	private EventRepository eRep;

	@Autowired
	private UserRepository uRep;

	@PostMapping("/api/event")
	public @ResponseBody jsonStatus createEvent(@RequestHeader (name="Authorization") String token, 
			@RequestParam String creatorMail, @RequestParam String text, @RequestParam String multiMedia) {
		//userId extracted from the auth token
		String userId = Jwts.parser().setSigningKey(SECRET).parseClaimsJws(token.replace("Bearer", ""))
				.getBody()
				.getSubject();
	
		Optional<User> ou = uRep.findById(userId);
		if (ou.isEmpty())
			return new jsonStatus("NOT OK", "Invalid User");
		User u = ou.get();
		
		if (! creatorMail.equals(u.getEmail()))
			return new jsonStatus("NOT OK", "User does not match");
		
		Event ev = new Event(userId, text, multiMedia);
		ev.setCreatorMail(creatorMail);
		ev.setCreatorName(u.getName());
		
		if (eRep.save(ev) != null) {
			u.setLastPost(new Date());
			u.setLastActivity(u.getLastPost());
			uRep.save(u);
			return new jsonStatus("OK", "Event saved");
		}
		else
			return new jsonStatus("NOT OK", "Cannot save event");
	}

	@GetMapping("/api/event")
	public @ResponseBody List<Event> requestEvent(@RequestParam (value = "number", defaultValue = "5") String number, 
			@RequestParam (value ="pagenumber", defaultValue= "0") String pagenumber){
		
		int pageNumber, numEvents;
		try {
			numEvents = Integer.parseInt(number);
			pageNumber = Integer.parseInt(pagenumber);
		} catch (NumberFormatException e) {
			pageNumber = 0;
			numEvents = 5;
		}

		// Implement something like "SELECT * FROM c ORDER BY c.createdAt DESC OFFSET 0 LIMIT number"
		
		List<Event> ret = eRep.getLastEvents(numEvents);
		return ret;
	}
	
	@GetMapping("/api/userdetails")
	public @ResponseBody UserPublic userDetails(@RequestHeader (name="Authorization") String token) {
		String userId = Jwts.parser().setSigningKey(SECRET).parseClaimsJws(token.replace("Bearer", ""))
				.getBody()
				.getSubject();
		Optional<User> u = uRep.findById(userId);
		if (u.isPresent()) {
			UserPublic ud = new UserPublic(u.get());
			return ud;
		} else {
			return null;
		}
	}
	
	@PostMapping("/api/eventDetails")
	public @ResponseBody jsonStatus eventDetails(@RequestHeader (name="Authorization") String token,
			@RequestParam String command, @RequestParam String eventId) {
		String userId = Jwts.parser().setSigningKey(SECRET).parseClaimsJws(token.replace("Bearer", ""))
				.getBody()
				.getSubject();
		Optional evo = eRep.findById(eventId);
		
		jsonStatus ret = new jsonStatus ();
		
		if (evo.isEmpty())
			ret.setStatus("NOT OK", "Invalid eventId");
		Event ev = (Event) evo.get();
		switch (command) {
			case "remove":
				if (ev.getCreatorId().equals(userId)) {
					eRep.delete(ev);
					ret.setStatus("OK", "Event removed");
				}
				else 
					ret.setStatus("NOT OK", "Unathorized user");
			
			case "thumbsUp":
				if (ev.getCreatorId().equals(userId))
					ret.setStatus("NOT OK", "No te des likes a ti mismo capuyo");
				else
					if (ev.addLike(userId)) {
						eRep.save(ev);
						ret.setStatus("OK", "You like this");
					}
					else
						ret.setStatus("OK", "You already liked this");
			
			case "thumbsSown":
				if (ev.getCreatorId().equals(userId))
					ret.setStatus("NOT OK", "No te des dislikes a ti mismo capuyo");
				else
					if (ev.addDislike(userId)) {
						eRep.save(ev);
						ret.setStatus("OK", "You hate this");
					}
					else
						ret.setStatus("OK", "You already hated this");
					
		}
		return ret;
	}

	@PostMapping("/createuser")
	public @ResponseBody jsonStatus createUser(@RequestParam String name, @RequestParam String email, @RequestParam String password) {
		// Email must be unique
		List<User> ul = uRep.findByEmail(email);
		if (ul.size()>0)
			return new jsonStatus("NOT OK", email + " Email address already used");
		
		User u = new User(name, email, password);
		u.encryptPassword();
		if (uRep.save(u)!= null)
			return new jsonStatus("OK", "Creado el usuario con Id: "+u.getId()+" Usuarios en la BBDD :"+uRep.count());
		else
			return new jsonStatus("NOT OK", "algo chungo ocurre");
	}
}
