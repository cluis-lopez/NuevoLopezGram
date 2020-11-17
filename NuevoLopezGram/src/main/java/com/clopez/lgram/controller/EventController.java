package com.clopez.lgram.controller;

import java.util.ArrayList;
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
	public @ResponseBody jsonStatus createEvent(@RequestHeader (name="Authorization") String token, @RequestParam String creatorName, @RequestParam String text, @RequestParam String multiMedia) {
		//userId extracted from the auth token
		String userId = Jwts.parser().setSigningKey(SECRET).parseClaimsJws(token.replace("Bearer", ""))
				.getBody()
				.getSubject();

		Event ev = new Event(userId, text, multiMedia);
		ev.setCreatorName(creatorName);
		
		if (eRep.save(ev) != null)
			return new jsonStatus("OK", "Event saved");
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
