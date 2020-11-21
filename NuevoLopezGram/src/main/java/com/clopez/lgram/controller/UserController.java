package com.clopez.lgram.controller;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

import com.clopez.lgram.datamodel.User;
import com.clopez.lgram.datamodel.UserPublic;
import com.clopez.lgram.datamodel.UserRepository;
import com.clopez.lgram.datamodel.jsonStatus;

import io.jsonwebtoken.Jwts;

@RestController
public class UserController {
	
	@Value("${jwt.secret}")
	String SECRET;

	@Autowired
	private UserRepository uRep;


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
	public @ResponseBody jsonStatus createUser(@RequestParam("name") 
			String name, @RequestParam("email") String email, @RequestParam("password") String password) {
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
