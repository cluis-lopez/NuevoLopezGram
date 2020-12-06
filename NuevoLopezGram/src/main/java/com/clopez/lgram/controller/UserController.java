package com.clopez.lgram.controller;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.DeleteMapping;
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
	
	@DeleteMapping("/api/userdetails")
	public @ResponseBody jsonStatus deleteUser(@RequestHeader (name="Authorization") String token) {
		String userId = Jwts.parser().setSigningKey(SECRET).parseClaimsJws(token.replace("Bearer", ""))
				.getBody()
				.getSubject();
		Optional<User> u = uRep.findById(userId);
		if (u.isEmpty())
			return new jsonStatus("NOT OK", "Invalid user");
		User user = u.get();
		String email = user.getEmail();
		uRep.delete(user);
		//TODO Remove all user's posts before deleting from database
		return new jsonStatus("OK", "User " + email + " with id: "+ userId + " has been deleted");
	}
	
	
	@PostMapping("/api/changepassword")
	public @ResponseBody jsonStatus changePassword(@RequestHeader (name="Authorization") String token,
			@RequestParam String oldPassword, @RequestParam String newPassword){
		String userId = Jwts.parser().setSigningKey(SECRET).parseClaimsJws(token.replace("Bearer", ""))
				.getBody()
				.getSubject();
		Optional<User> u = uRep.findById(userId);
		if (u.isEmpty())
			return new jsonStatus("NOT OK", "Invalid User");
		
		User user = u.get();
		
		String codedOldPassword = new BCryptPasswordEncoder().encode(oldPassword);
		if ( ! codedOldPassword.equals(user.getPassword()))
			return new jsonStatus("NOT OK", "Invalid Password");
		
		user.setPassword(newPassword);
		user.encryptPassword();
		uRep.save(user);
		return new jsonStatus("OK", "Password updated");
	}
	
	@PostMapping("/createuser")
	public @ResponseBody jsonStatus createUser(@RequestParam("name") 
			String name, @RequestParam("email") String email, @RequestParam("password") String password) {
		// Email must be unique
		List<User> ul = uRep.findByEmail(email);
		if ( ! ul.isEmpty())
			return new jsonStatus("NOT OK", email + " Email address already used");
		
		User u = new User(name, email, password);
		u.encryptPassword();
		if (uRep.save(u)!= null)
			return new jsonStatus("OK", "Creado el usuario con Id: "+u.getId()+" Usuarios en la BBDD :"+uRep.count());
		else
			return new jsonStatus("NOT OK", "algo chungo ocurre");
	}
}
