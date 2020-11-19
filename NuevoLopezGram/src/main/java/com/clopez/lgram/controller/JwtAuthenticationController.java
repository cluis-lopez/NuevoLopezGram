package com.clopez.lgram.controller;

import java.util.Date;
import java.util.List;
import java.util.Objects;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

import com.clopez.lgram.datamodel.UserRepository;
import com.clopez.lgram.security.JwtRequest;
import com.clopez.lgram.security.JwtResponse;
import com.clopez.lgram.security.JwtTokenUtil;
import com.clopez.lgram.security.JwtUserDetailsService;

@RestController
@CrossOrigin
public class JwtAuthenticationController {
	@Autowired
	private AuthenticationManager authenticationManager;
	@Autowired
	private JwtTokenUtil jwtTokenUtil;
	@Autowired
	private JwtUserDetailsService userDetailsService;
	
	@Autowired
	private UserRepository uRep;
	
	@RequestMapping(value = "/authenticate", method = RequestMethod.POST)
	public ResponseEntity<?> createAuthenticationToken(@RequestBody JwtRequest authenticationRequest) throws Exception {
		//We use email for login forms (easy to type & remember) but userId as the "username" for id proposes 
		List<com.clopez.lgram.datamodel.User> userList = uRep.findByEmail(authenticationRequest.getUsername()); //This is email in fact
		if (userList == null || userList.size() != 1)
			throw new UsernameNotFoundException("Invalid email or email not found : ");
		String username = userList.get(0).getId();
				
				
		authenticate(username, authenticationRequest.getPassword());
		final UserDetails userDetails = userDetailsService
				.loadUserByUsername(username);
		final String token = jwtTokenUtil.generateToken(userDetails);
		//salvamos el Date del último login del usuario
		userList.get(0).setLastLogin(new Date());
		uRep.save(userList.get(0));
		return ResponseEntity.ok(new JwtResponse(token));
	}
	
	private void authenticate(String username, String password) throws Exception {
		try {
			authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(username, password));
		} catch (LockedException e) {
			throw new Exception("USER LOCKED", e);
		} catch (DisabledException e) {
			throw new Exception("USER_DISABLED", e);
		} catch (BadCredentialsException e) {
			throw new Exception("INVALID_CREDENTIALS", e);
		}
	}
}
